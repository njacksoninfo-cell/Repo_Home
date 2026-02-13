// FC Dallas Kit Data
// Images are in kits/home/, kits/away/, and kits/third/
// Filename format: "YEAR Type.jpg" (e.g., "1996 Home.jpg")

var homeKits = [
    { year: "1996",    team: "Dallas Burn",  kit: "Inaugural Kit",         img: "kits/home/1996 Home.jpg" },
    { year: "1997",    team: "Dallas Burn",  kit: "Hoops Kit",             img: "kits/home/1997 Home.jpg" },
    { year: "1999",    team: "Dallas Burn",  kit: "Wordmark Kit",          img: "kits/home/1999 Home.jpg" },
    { year: "2000",    team: "Dallas Burn",  kit: "Frosted Flakes Kit",    img: "kits/home/2000 Home.jpg" },
    { year: "2001",    team: "Dallas Burn",  kit: "2001 Home Kit",         img: "kits/home/2001 Home.jpg" },
    { year: "2002",    team: "Dallas Burn",  kit: "Black Accent Kit",      img: "kits/home/2002 Home.jpg" },
    { year: "2004",    team: "Dallas Burn",  kit: "RadioShack Kit",        img: "kits/home/2004 Home.jpg" },
    { year: "2005",    team: "FC Dallas",    kit: "Rebrand Hoops Kit",     img: "kits/home/2005 Home.jpg" },
    { year: "2007",    team: "FC Dallas",    kit: "Teamgeist Hoops Kit",   img: "kits/home/2007 Home.jpg" },
    { year: "2009",    team: "FC Dallas",    kit: "LH Patch Kit",          img: "kits/home/2009 Home.jpg" },
    { year: "2010",    team: "FC Dallas",    kit: "Red Hoops Kit",         img: "kits/home/2010 Home.jpg" },
    { year: "2011",    team: "FC Dallas",    kit: "2011 Home Kit",         img: "kits/home/2011 Home.jpg" },
    { year: "2012",    team: "FC Dallas",    kit: "Updated Hoops Kit",     img: "kits/home/2012 Home.jpg" },
    { year: "2013",    team: "FC Dallas",    kit: "2013 Home Kit",         img: "kits/home/2013 Home.jpg" },
    { year: "2014",    team: "FC Dallas",    kit: "Red-on-Red Hoops Kit",  img: "kits/home/2014 Home.jpg" },
    { year: "2016",    team: "FC Dallas",    kit: "Shield Winners Kit",    img: "kits/home/2016 Home.jpg" },
    { year: "2018",    team: "FC Dallas",    kit: "Stars at Night Kit",    img: "kits/home/2018 Home.jpg" },
    { year: "2021",    team: "FC Dallas",    kit: "Blue Accent Kit",       img: "kits/home/2021 Home.jpg" },
    { year: "2022",    team: "FC Dallas",    kit: "2022 Primary Kit",      img: "kits/home/2022 Home.jpg" },
    { year: "2023",    team: "FC Dallas",    kit: "2023 Primary Kit",      img: "kits/home/2023 Home.jpg" },
    { year: "2025",    team: "FC Dallas",    kit: "Legacy Kit",            img: "kits/home/2025 Home.jpg" },
    { year: "2026",    team: "FC Dallas",    kit: "DNA Kit",               img: "kits/home/2026 Home.jpg" },
];

var thirdKits = [
    { year: "1996",    team: "Dallas Burn",  kit: "1996 Training Kit",     img: "kits/third/1996 Training.jpg" },
    { year: "1999",    team: "Dallas Burn",  kit: "1999 Training Kit",     img: "kits/third/1999 Training.jpg" },
    { year: "2002",    team: "Dallas Burn",  kit: "2002 Third Kit",        img: "kits/third/2002 Third.jpg" },
    { year: "2006",    team: "FC Dallas",    kit: "2006 Special Kit",      img: "kits/third/2006 Special.jpg" },
    { year: "2018",    team: "FC Dallas",    kit: "2018 Special Kit",      img: "kits/third/2018 Special.jpg" },
    { year: "2019",    team: "FC Dallas",    kit: "2019 Special Kit",      img: "kits/third/2019 Special.jpg" },
    { year: "2021",    team: "FC Dallas",    kit: "2021 Special Kit",      img: "kits/third/2021 Special.jpg" },
    { year: "2022",    team: "FC Dallas",    kit: "2022 Special Kit",      img: "kits/third/2022 Special.jpg" },
    { year: "2025",    team: "FC Dallas",    kit: "Legacy Third Kit",      img: "kits/third/2025 Third.jpg" },
];

var awayKits = [
    { year: "1996",    team: "Dallas Burn",  kit: "Inaugural Away Kit",    img: "kits/away/1996 Away.jpg" },
    { year: "1997",    team: "Dallas Burn",  kit: "Red Away Kit",          img: "kits/away/1997 Away.jpg" },
    { year: "1999",    team: "Dallas Burn",  kit: "Away Wordmark Kit",     img: "kits/away/1999 Away.jpg" },
    { year: "2000",    team: "Dallas Burn",  kit: "White Away Kit",        img: "kits/away/2000 Away.jpg" },
    { year: "2002",    team: "Dallas Burn",  kit: "2002 Away Kit",         img: "kits/away/2002 Away.jpg" },
    { year: "2004",    team: "Dallas Burn",  kit: "Away RadioShack Kit",   img: "kits/away/2004 Away.jpg" },
    { year: "2005",    team: "FC Dallas",    kit: "Rebrand Away Kit",      img: "kits/away/2005 Away.jpg" },
    { year: "2007",    team: "FC Dallas",    kit: "White Hoops Kit",       img: "kits/away/2007 Away.jpg" },
    { year: "2009",    team: "FC Dallas",    kit: "Blue Away Kit",         img: "kits/away/2009 Away.jpg" },
    { year: "2011",    team: "FC Dallas",    kit: "White Away Kit",        img: "kits/away/2011 Away.jpg" },
    { year: "2012",    team: "FC Dallas",    kit: "Blue Hoops Away Kit",   img: "kits/away/2012 Away.jpg" },
    { year: "2013",    team: "FC Dallas",    kit: "2013 Away Kit",         img: "kits/away/2013 Away.jpg" },
    { year: "2015",    team: "FC Dallas",    kit: "Blue Away Kit",         img: "kits/away/2015 Away.jpg" },
    { year: "2017",    team: "FC Dallas",    kit: "Secondary Kit",         img: "kits/away/2017 Away.jpg" },
    { year: "2019",    team: "FC Dallas",    kit: "Legacy Away Kit",       img: "kits/away/2019 Away.jpg" },
    { year: "2021",    team: "FC Dallas",    kit: "White Secondary Kit",   img: "kits/away/2021 Away.jpg" },
    { year: "2023",    team: "FC Dallas",    kit: "2023 Secondary Kit",    img: "kits/away/2023 Away.jpg" },
    { year: "2026",    team: "FC Dallas",    kit: "2026 Away Kit",         img: "kits/away/2026 Away.jpg" },
];

// Build namMember array from selected mode
// Third kits are included in both home and away modes
// Format: "imgHTML|TeamName Year|KitName"
function buildKitList(mode) {
    var kits = (mode === "home") ? homeKits : awayKits;
    var combined = kits.concat(thirdKits);
    var list = [];
    for (var i = 0; i < combined.length; i++) {
        var k = combined[i];
        var imgHTML = "<img src='" + k.img + "' alt='" + k.team + " " + k.year + "'>";
        list.push(imgHTML + "|" + k.team + " " + k.year + "|" + k.kit);
    }
    return list;
}

// Get all kits for a mode (used by canvas poster)
function getAllKits(mode) {
    var kits = (mode === "home") ? homeKits : awayKits;
    return kits.concat(thirdKits);
}
