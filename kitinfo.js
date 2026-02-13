// FC Dallas Kit Data
// To add your own images, place them in kits/home/ and kits/away/
// Image naming convention: YEAR.png (e.g., 1996.png, 2006.png)
// Supported formats: .png, .jpg, .webp

var homeKits = [
    { year: "1996",    team: "Dallas Burn",  kit: "Inaugural Kit",         img: "kits/home/1996.png" },
    { year: "1997",    team: "Dallas Burn",  kit: "Hoops Kit",             img: "kits/home/1997.png" },
    { year: "1998-99", team: "Dallas Burn",  kit: "Wordmark Kit",          img: "kits/home/1998.png" },
    { year: "2000-01", team: "Dallas Burn",  kit: "Frosted Flakes Kit",    img: "kits/home/2000.png" },
    { year: "2002",    team: "Dallas Burn",  kit: "Black Accent Kit",      img: "kits/home/2002.png" },
    { year: "2003-04", team: "Dallas Burn",  kit: "RadioShack Kit",        img: "kits/home/2003.png" },
    { year: "2005",    team: "FC Dallas",    kit: "Rebrand Hoops Kit",     img: "kits/home/2005.png" },
    { year: "2006-07", team: "FC Dallas",    kit: "Teamgeist Hoops Kit",   img: "kits/home/2006.png" },
    { year: "2008-09", team: "FC Dallas",    kit: "LH Patch Kit",          img: "kits/home/2008.png" },
    { year: "2010-11", team: "FC Dallas",    kit: "Red Hoops Kit",         img: "kits/home/2010.png" },
    { year: "2012-13", team: "FC Dallas",    kit: "Updated Hoops Kit",     img: "kits/home/2012.png" },
    { year: "2014-15", team: "FC Dallas",    kit: "Red-on-Red Hoops Kit",  img: "kits/home/2014.png" },
    { year: "2016-17", team: "FC Dallas",    kit: "Shield Winners Kit",    img: "kits/home/2016.png" },
    { year: "2018",    team: "FC Dallas",    kit: "Stars at Night Kit",    img: "kits/home/2018.png" },
    { year: "2019",    team: "FC Dallas",    kit: "Reunion Kit",           img: "kits/home/2019.png" },
    { year: "2020-21", team: "FC Dallas",    kit: "Blue Accent Kit",       img: "kits/home/2020.png" },
    { year: "2022",    team: "FC Dallas",    kit: "2022 Primary Kit",      img: "kits/home/2022.png" },
    { year: "2023",    team: "FC Dallas",    kit: "2023 Primary Kit",      img: "kits/home/2023.png" },
    { year: "2024",    team: "FC Dallas",    kit: "Inferno Kit",           img: "kits/home/2024.png" },
    { year: "2025",    team: "FC Dallas",    kit: "Legacy Kit",            img: "kits/home/2025.png" },
    { year: "2026",    team: "FC Dallas",    kit: "DNA Kit",               img: "kits/home/2026.png" },
];

var thirdKits = [
    { year: "2001-02", team: "Dallas Burn",  kit: "Black Third Kit",       img: "kits/third/2001.png" },
    { year: "2025",    team: "FC Dallas",    kit: "Legacy Third Kit",      img: "kits/third/2025.png" },
];

var awayKits = [
    { year: "1996",    team: "Dallas Burn",  kit: "Inaugural Away Kit",    img: "kits/away/1996.png" },
    { year: "1997",    team: "Dallas Burn",  kit: "Red Away Kit",          img: "kits/away/1997.png" },
    { year: "1998-99", team: "Dallas Burn",  kit: "Away Wordmark Kit",     img: "kits/away/1998.png" },
    { year: "2000-01", team: "Dallas Burn",  kit: "White Away Kit",        img: "kits/away/2000.png" },
    { year: "2002",    team: "Dallas Burn",  kit: "2002 Away Kit",         img: "kits/away/2002.png" },
    { year: "2003-04", team: "Dallas Burn",  kit: "Away RadioShack Kit",   img: "kits/away/2003.png" },
    { year: "2005",    team: "FC Dallas",    kit: "Rebrand Away Kit",      img: "kits/away/2005.png" },
    { year: "2006-07", team: "FC Dallas",    kit: "White Hoops Kit",       img: "kits/away/2006.png" },
    { year: "2008-09", team: "FC Dallas",    kit: "Blue Away Kit",         img: "kits/away/2008.png" },
    { year: "2010-11", team: "FC Dallas",    kit: "White Away Kit",        img: "kits/away/2010.png" },
    { year: "2012-13", team: "FC Dallas",    kit: "Blue Hoops Away Kit",   img: "kits/away/2012.png" },
    { year: "2014-15", team: "FC Dallas",    kit: "Blue Away Kit",         img: "kits/away/2014.png" },
    { year: "2016-17", team: "FC Dallas",    kit: "Secondary Kit",         img: "kits/away/2016.png" },
    { year: "2018",    team: "FC Dallas",    kit: "Community Kit",         img: "kits/away/2018.png" },
    { year: "2019",    team: "FC Dallas",    kit: "Legacy Away Kit",       img: "kits/away/2019.png" },
    { year: "2020-21", team: "FC Dallas",    kit: "White Secondary Kit",   img: "kits/away/2020.png" },
    { year: "2022",    team: "FC Dallas",    kit: "2022 Secondary Kit",    img: "kits/away/2022.png" },
    { year: "2023",    team: "FC Dallas",    kit: "2023 Secondary Kit",    img: "kits/away/2023.png" },
    { year: "2024",    team: "FC Dallas",    kit: "2024 Away Kit",         img: "kits/away/2024.png" },
    { year: "2025",    team: "FC Dallas",    kit: "2025 Away Kit",         img: "kits/away/2025.png" },
    { year: "2026",    team: "FC Dallas",    kit: "2026 Away Kit",         img: "kits/away/2026.png" },
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
