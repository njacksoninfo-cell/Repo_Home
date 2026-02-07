import type { Dog } from '../types/dog';

const API_BASE = 'https://api.rescuegroups.org/v5/public';

interface RescueGroupsAnimal {
  id: string;
  attributes: {
    name?: string;
    breedPrimary?: string;
    breedSecondary?: string;
    ageGroup?: string;
    sex?: string;
    sizeGroup?: string;
    descriptionText?: string;
    pictureThumbnailUrl?: string;
    distance?: number;
    locationCitystate?: string;
    url?: string;
  };
  relationships?: {
    pictures?: {
      data: Array<{ id: string }>;
    };
    orgs?: {
      data: Array<{ id: string }>;
    };
  };
}

interface RescueGroupsIncluded {
  type: string;
  id: string;
  attributes: Record<string, unknown>;
}

interface RescueGroupsResponse {
  data: RescueGroupsAnimal[];
  included?: RescueGroupsIncluded[];
  meta?: {
    count: number;
    pages: number;
    transactionId: string;
  };
}

function parseAnimal(
  animal: RescueGroupsAnimal,
  included: RescueGroupsIncluded[]
): Dog {
  const attrs = animal.attributes;

  const pictureIds =
    animal.relationships?.pictures?.data?.map((p) => p.id) ?? [];
  const photos: string[] = [];

  for (const pid of pictureIds) {
    const pic = included.find((i) => i.type === 'pictures' && i.id === pid);
    if (pic?.attributes) {
      const a = pic.attributes;
      const url =
        (a.large as string) ||
        (a.original as string) ||
        (a.small as string) ||
        (a.fullsize as string) ||
        (a.originalUrl as string) ||
        (a.largeUrl as string) ||
        (a.smallUrl as string) ||
        (a.url as string) ||
        (a.thumbnailUrl as string);
      if (url) photos.push(url);
    }
  }

  // Fallback to the thumbnail on the animal itself
  if (photos.length === 0 && attrs.pictureThumbnailUrl) {
    photos.push(attrs.pictureThumbnailUrl);
  }

  // If still no photos, try any remaining picture includes for this animal
  if (photos.length === 0) {
    for (const pid of pictureIds) {
      const pic = included.find((i) => i.type === 'pictures' && i.id === pid);
      if (pic?.attributes) {
        // Grab the first string value that looks like a URL
        for (const val of Object.values(pic.attributes)) {
          if (typeof val === 'string' && val.startsWith('http')) {
            photos.push(val);
            break;
          }
        }
      }
      if (photos.length > 0) break;
    }
  }

  const orgId = animal.relationships?.orgs?.data?.[0]?.id;
  const org = orgId
    ? included.find((i) => i.type === 'orgs' && i.id === orgId)
    : undefined;
  const organizationName =
    (org?.attributes?.name as string) ?? 'Local Shelter';

  let breed = attrs.breedPrimary ?? 'Mixed Breed';
  if (attrs.breedSecondary) {
    breed += ` / ${attrs.breedSecondary}`;
  }

  // Always provide an adoption link
  const adoptionUrl =
    attrs.url ||
    `https://www.rescuegroups.org/animals/detail?animalID=${animal.id}`;

  return {
    id: animal.id,
    name: attrs.name ?? 'Unknown',
    breed,
    age: attrs.ageGroup ?? 'Unknown',
    sex: attrs.sex ?? 'Unknown',
    size: attrs.sizeGroup ?? 'Unknown',
    description: attrs.descriptionText ?? '',
    photos,
    location: attrs.locationCitystate ?? 'Unknown location',
    organizationName,
    url: adoptionUrl,
    distance: attrs.distance ? `${Math.round(attrs.distance)} mi` : undefined,
  };
}

export async function fetchDogs(
  apiKey: string,
  zipCode: string,
  page = 1,
  limit = 20
): Promise<{ dogs: Dog[]; totalPages: number }> {
  const url = `${API_BASE}/animals/search/available/dogs/`;

  const body = {
    data: {
      filterRadius: {
        miles: 100,
        postalcode: zipCode,
      },
    },
  };

  const params = new URLSearchParams({
    limit: String(limit),
    page: String(page),
    sort: 'random',
    include: 'pictures,orgs',
    'fields[animals]':
      'name,breedPrimary,breedSecondary,ageGroup,sex,sizeGroup,descriptionText,pictureThumbnailUrl,distance,locationCitystate,url',
    'fields[pictures]':
      'original,large,small,fullsize,url,thumbnailUrl,originalUrl,largeUrl,smallUrl',
    'fields[orgs]': 'name',
  });

  const response = await fetch(`${url}?${params}`, {
    method: 'POST',
    headers: {
      Authorization: apiKey,
      'Content-Type': 'application/vnd.api+json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `API error ${response.status}: ${text.slice(0, 200)}`
    );
  }

  const json: RescueGroupsResponse = await response.json();
  const included = json.included ?? [];
  const dogs = json.data.map((a) => parseAnimal(a, included));
  const totalPages = json.meta?.pages ?? 1;

  return { dogs, totalPages };
}
