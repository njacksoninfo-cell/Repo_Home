// === FC DALLAS KIT RANKER ===
// Supports two ranking engines: Merge Sort (full) and Elo (quick)

// === SHARED STATE ===
var namMember = [];
var kitObjects = [];
var currentMode = null; // "home", "away", or "third"
var rankingSpeed = "quick"; // "quick" or "full"
var undoHistory = [];

// Final sorted order stored in lstMember[0] for both engines
var lstMember = [];

// === MERGE SORT STATE ===
var parent = [];
var rec = [];
var cmp1, cmp2;
var head1, head2;
var nrec;
var numQuestion;
var totalSize;
var finishSize;

// === ELO STATE ===
var eloRatings = [];
var eloCompared = {};
var eloLeft = 0;
var eloRight = 1;
var eloRound = 0;
var eloMaxRounds = 0;

// === SPEED TOGGLE ===

function setSpeed(speed) {
    rankingSpeed = speed;
    document.getElementById("speedQuick").className = speed === "quick" ? "speed-btn active" : "speed-btn";
    document.getElementById("speedFull").className = speed === "full" ? "speed-btn active" : "speed-btn";
    updateRoundEstimates();
}

function updateRoundEstimates() {
    var counts = { home: homeKits.length, away: awayKits.length, third: thirdKits.length, all: allKits.length };
    var modes = ["home", "away", "third", "all"];
    for (var m = 0; m < modes.length; m++) {
        var n = counts[modes[m]];
        var rounds;
        if (rankingSpeed === "quick" || modes[m] === "all") {
            rounds = Math.ceil(n * 1.5);
        } else {
            rounds = n * Math.ceil(Math.log(n) / Math.log(2));
        }
        var el = document.getElementById(modes[m] + "Count");
        if (el) el.textContent = n + " kits \u00B7 ~" + rounds + " rounds";
    }
}

// === INITIALIZATION ===

function startRanking(mode) {
    currentMode = mode;
    namMember = buildKitList(mode);
    undoHistory = [];

    document.getElementById("modeSelect").style.display = "none";
    document.getElementById("battleScreen").style.display = "flex";

    // "All" mode always uses Elo (too many kits for merge sort)
    if (rankingSpeed === "quick" || mode === "all") {
        initEloRank();
    } else {
        initMergeSort();
    }
    showImage();
}

function goBack() {
    if (confirm("Go back to mode selection? Your progress will be lost.")) {
        document.getElementById("battleScreen").style.display = "none";
        document.getElementById("modeSelect").style.display = "flex";
        resetState();
    }
}

function resetState() {
    namMember = [];
    lstMember = [];
    parent = [];
    rec = [];
    undoHistory = [];
    currentMode = null;
    kitObjects = [];
    eloRatings = [];
    eloCompared = {};
    eloRound = 0;
}

// === MERGE SORT ENGINE ===

function initMergeSort() {
    var n = 0;
    var mid;

    lstMember = [];
    parent = [];
    rec = [];

    lstMember[n] = [];
    for (var i = 0; i < namMember.length; i++) {
        lstMember[n][i] = i;
    }
    parent[n] = -1;
    totalSize = 0;
    n++;

    for (var i = 0; i < lstMember.length; i++) {
        if (lstMember[i].length >= 2) {
            mid = Math.ceil(lstMember[i].length / 2);

            lstMember[n] = lstMember[i].slice(0, mid);
            totalSize += lstMember[n].length;
            parent[n] = i;
            n++;

            lstMember[n] = lstMember[i].slice(mid);
            totalSize += lstMember[n].length;
            parent[n] = i;
            n++;
        }
    }

    for (var i = 0; i < namMember.length; i++) {
        rec[i] = 0;
    }
    nrec = 0;

    cmp1 = lstMember.length - 2;
    cmp2 = lstMember.length - 1;
    head1 = 0;
    head2 = 0;
    numQuestion = 1;
    finishSize = 0;
}

function processMergeSortChoice(flag) {
    if (flag < 0) {
        rec[nrec] = lstMember[cmp1][head1];
        head1++;
    } else {
        rec[nrec] = lstMember[cmp2][head2];
        head2++;
    }
    nrec++;
    finishSize++;

    // Drain remaining items
    if (head1 < lstMember[cmp1].length && head2 === lstMember[cmp2].length) {
        while (head1 < lstMember[cmp1].length) {
            rec[nrec] = lstMember[cmp1][head1];
            head1++;
            nrec++;
            finishSize++;
        }
    } else if (head1 === lstMember[cmp1].length && head2 < lstMember[cmp2].length) {
        while (head2 < lstMember[cmp2].length) {
            rec[nrec] = lstMember[cmp2][head2];
            head2++;
            nrec++;
            finishSize++;
        }
    }

    // Merge complete for this pair
    if (head1 === lstMember[cmp1].length && head2 === lstMember[cmp2].length) {
        for (var i = 0; i < lstMember[cmp1].length + lstMember[cmp2].length; i++) {
            lstMember[parent[cmp1]][i] = rec[i];
        }
        lstMember.pop();
        lstMember.pop();
        cmp1 -= 2;
        cmp2 -= 2;
        head1 = 0;
        head2 = 0;

        for (var i = 0; i < namMember.length; i++) {
            rec[i] = 0;
        }
        nrec = 0;
    }

    // Check if sorting is complete
    if (cmp1 < 0) {
        document.getElementById("battleScreen").style.display = "none";
        showResults();
        return;
    }
    showImage();
}

// === ELO ENGINE ===

function initEloRank() {
    eloRatings = [];
    eloCompared = {};
    eloRound = 0;
    eloMaxRounds = Math.ceil(namMember.length * 1.5);

    for (var i = 0; i < namMember.length; i++) {
        eloRatings.push({ rating: 1500, count: 0 });
    }

    pickEloMatchup();
}

function pickEloMatchup() {
    var bestPair = null;
    var bestScore = -Infinity;
    var n = namMember.length;

    for (var i = 0; i < n; i++) {
        for (var j = i + 1; j < n; j++) {
            var key = i + "," + j;
            if (eloCompared[key]) continue;

            var ratingDiff = Math.abs(eloRatings[i].rating - eloRatings[j].rating);
            var minCount = Math.min(eloRatings[i].count, eloRatings[j].count);

            // Prioritize kits with fewer comparisons, then closer ratings
            var score = (10 - minCount) * 1000 - ratingDiff;

            if (score > bestScore) {
                bestScore = score;
                bestPair = [i, j];
            }
        }
    }

    if (!bestPair) {
        // All pairs exhausted — finish early
        finishEloRank();
        return;
    }

    // Randomize left/right to avoid position bias
    if (Math.random() < 0.5) {
        eloLeft = bestPair[0];
        eloRight = bestPair[1];
    } else {
        eloLeft = bestPair[1];
        eloRight = bestPair[0];
    }
}

function processEloChoice(flag) {
    var winner, loser;
    if (flag < 0) {
        winner = eloLeft;
        loser = eloRight;
    } else {
        winner = eloRight;
        loser = eloLeft;
    }

    // Elo update (K=32)
    var K = 32;
    var Ra = eloRatings[winner].rating;
    var Rb = eloRatings[loser].rating;
    var Ea = 1 / (1 + Math.pow(10, (Rb - Ra) / 400));

    eloRatings[winner].rating = Ra + K * (1 - Ea);
    eloRatings[loser].rating = Rb - K * Ea;

    eloRatings[winner].count++;
    eloRatings[loser].count++;

    var key = Math.min(eloLeft, eloRight) + "," + Math.max(eloLeft, eloRight);
    eloCompared[key] = true;

    eloRound++;

    if (eloRound >= eloMaxRounds) {
        finishEloRank();
        return;
    }

    pickEloMatchup();
    showImage();
}

function finishEloRank() {
    // Build sorted index array by rating (descending)
    var indices = [];
    for (var i = 0; i < namMember.length; i++) {
        indices.push(i);
    }
    indices.sort(function(a, b) {
        return eloRatings[b].rating - eloRatings[a].rating;
    });

    lstMember = [indices];

    document.getElementById("battleScreen").style.display = "none";
    showResults();
}

// === UNIFIED CHOICE DISPATCHER ===

function makeChoice(flag) {
    saveState();
    if (rankingSpeed === "quick") {
        processEloChoice(flag);
    } else {
        numQuestion++;
        processMergeSortChoice(flag);
    }
}

// === SAVE STATE FOR UNDO ===

function saveState() {
    var state = {
        rankingSpeed: rankingSpeed,
        lstMember: JSON.parse(JSON.stringify(lstMember)),
        numQuestion: numQuestion
    };

    if (rankingSpeed === "quick") {
        state.eloRatings = JSON.parse(JSON.stringify(eloRatings));
        state.eloCompared = JSON.parse(JSON.stringify(eloCompared));
        state.eloLeft = eloLeft;
        state.eloRight = eloRight;
        state.eloRound = eloRound;
        state.eloMaxRounds = eloMaxRounds;
    } else {
        state.parent = parent.slice();
        state.rec = rec.slice();
        state.cmp1 = cmp1;
        state.cmp2 = cmp2;
        state.head1 = head1;
        state.head2 = head2;
        state.nrec = nrec;
        state.finishSize = finishSize;
        state.totalSize = totalSize;
    }

    undoHistory.push(state);
    if (undoHistory.length > 100) undoHistory.shift();
}

function undoLast() {
    if (undoHistory.length === 0) return;
    var state = undoHistory.pop();

    lstMember = state.lstMember;
    numQuestion = state.numQuestion;

    if (state.rankingSpeed === "quick") {
        eloRatings = state.eloRatings;
        eloCompared = state.eloCompared;
        eloLeft = state.eloLeft;
        eloRight = state.eloRight;
        eloRound = state.eloRound;
        eloMaxRounds = state.eloMaxRounds;
    } else {
        parent = state.parent;
        rec = state.rec;
        cmp1 = state.cmp1;
        cmp2 = state.cmp2;
        head1 = state.head1;
        head2 = state.head2;
        nrec = state.nrec;
        finishSize = state.finishSize;
        totalSize = state.totalSize;
    }

    showImage();
}

// === DISPLAY COMPARISON ===

function showImage() {
    var pct, matchupText, leftIdx, rightIdx;

    if (rankingSpeed === "quick") {
        pct = Math.floor(eloRound * 100 / eloMaxRounds);
        var currentRound = eloRound + 1;
        matchupText = "Matchup " + currentRound + " of ~" + eloMaxRounds + " \u00B7 " + pct + "%";
        leftIdx = eloLeft;
        rightIdx = eloRight;
    } else {
        pct = Math.floor(finishSize * 100 / totalSize);
        var estTotal = namMember.length * Math.ceil(Math.log(namMember.length) / Math.log(2));
        matchupText = "Matchup " + numQuestion + " of ~" + estTotal + " \u00B7 " + pct + "%";
        leftIdx = lstMember[cmp1][head1];
        rightIdx = lstMember[cmp2][head2];
    }

    var bar = document.getElementById("progressBar");
    bar.style.width = pct + "%";
    document.getElementById("matchupNumber").innerHTML = matchupText;

    var leftData = namMember[leftIdx].split("|");
    var rightData = namMember[rightIdx].split("|");

    var leftCard = document.getElementById("leftField");
    var rightCard = document.getElementById("rightField");

    leftCard.style.opacity = "0";
    rightCard.style.opacity = "0";
    leftCard.innerHTML = buildCardHTML(leftData);
    rightCard.innerHTML = buildCardHTML(rightData);
    setTimeout(function() {
        leftCard.style.opacity = "1";
        rightCard.style.opacity = "1";
    }, 50);
}

function buildCardHTML(parts) {
    var imgTag = parts[0];
    var teamYear = parts[1];
    var kitName = parts[2];

    var srcMatch = imgTag.match(/src='([^']*)'/);
    var imgSrc = srcMatch ? srcMatch[1] : "";

    return '<img src="' + imgSrc + '" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\';" alt="' + teamYear + '">' +
           '<div class="placeholder-kit" style="display:none;"><div class="placeholder-icon">&#128085;</div>' + teamYear + '</div>' +
           '<div class="kit-team">' + teamYear + '</div>' +
           '<div class="kit-name">' + kitName + '</div>';
}

// === RESULTS DISPLAY ===

function showResults() {
    var modeLabel = currentMode.toUpperCase();
    var kits = kitObjects;
    var colors = generateGradient(namMember.length);

    var modal = document.createElement("div");
    modal.className = "result-modal";

    // Header
    var header = document.createElement("div");
    header.className = "results-header";
    var speedLabel = rankingSpeed === "quick" ? " (Quick Rank)" : " (Full Rank)";
    header.innerHTML = '<h1>FC DALLAS ' + modeLabel + ' KIT RANKINGS</h1>' +
                       '<div class="results-accent"></div>' +
                       '<p>Ranked by ' + (rankingSpeed === "quick" ? "Elo rating" : "pairwise comparison") + speedLabel + '</p>';

    // Grid
    var grid = document.createElement("div");
    grid.className = "results-grid";

    var medals = ["#FFD700", "#C0C0C0", "#CD7F32"]; // gold, silver, bronze

    for (var i = 0; i < namMember.length; i++) {
        var idx = lstMember[0][i];
        var kitData = kits[idx];
        var ranking = i + 1;
        var rankColor = colors[i] || "#666";
        var isTop3 = i < 3;

        var card = document.createElement("div");
        card.className = "result-card" + (isTop3 ? " result-card-top" : "");

        var medalHTML = "";
        if (isTop3) {
            var medalSymbols = ["\uD83E\uDD47", "\uD83E\uDD48", "\uD83E\uDD49"];
            medalHTML = '<span class="result-medal">' + medalSymbols[i] + '</span>';
        }

        card.innerHTML = '<div class="result-color-bar" style="background:' + (isTop3 ? medals[i] : rankColor) + '"></div>' +
                         '<div class="result-rank" style="color:' + (isTop3 ? medals[i] : rankColor) + '">' + medalHTML + '#' + ranking + '</div>' +
                         '<img src="' + kitData.img + '" onerror="this.style.display=\'none\'" alt="' + kitData.team + ' ' + kitData.year + '">' +
                         '<div class="result-team">' + kitData.team + ' ' + kitData.year + '</div>' +
                         '<div class="result-kit">' + kitData.kit + '</div>';

        grid.appendChild(card);
    }

    var downloadBtn = document.createElement("button");
    downloadBtn.className = "modal-btn primary";
    downloadBtn.textContent = "Download Image";
    downloadBtn.onclick = function(e) {
        e.stopPropagation();
        generateInfographic();
    };

    var copyBtn = document.createElement("button");
    copyBtn.className = "modal-btn";
    copyBtn.textContent = "Copy Results";
    copyBtn.onclick = function(e) {
        e.stopPropagation();
        copyResultsToClipboard();
    };

    var restartBtn = document.createElement("button");
    restartBtn.className = "modal-btn";
    restartBtn.textContent = "Rank Again";
    restartBtn.onclick = function(e) {
        e.stopPropagation();
        document.body.removeChild(modal);
        startRanking(currentMode);
    };

    var closeBtn = document.createElement("button");
    closeBtn.className = "modal-btn";
    closeBtn.textContent = "Close";
    closeBtn.onclick = function() {
        document.body.removeChild(modal);
        document.getElementById("modeSelect").style.display = "flex";
        resetState();
    };

    // Download button at top, other actions at bottom
    var topActions = document.createElement("div");
    topActions.className = "modal-actions";
    topActions.appendChild(downloadBtn);

    var bottomActions = document.createElement("div");
    bottomActions.className = "modal-actions";
    bottomActions.appendChild(copyBtn);
    bottomActions.appendChild(restartBtn);
    bottomActions.appendChild(closeBtn);

    modal.appendChild(header);
    modal.appendChild(topActions);
    modal.appendChild(grid);
    modal.appendChild(bottomActions);

    document.body.appendChild(modal);
}

// === CANVAS INFOGRAPHIC WITH KIT IMAGES ===

// Load a kit image from pre-encoded base64 data (kitimages.js)
// Data URIs are same-origin so they never taint the canvas
function loadKitImage(src) {
    return new Promise(function(resolve) {
        var dataURI = (typeof kitImageData !== "undefined") ? kitImageData[src] : null;
        if (!dataURI) {
            resolve(null);
            return;
        }
        var img = new Image();
        img.onload = function() { resolve(img); };
        img.onerror = function() { resolve(null); };
        img.src = dataURI;
    });
}

function generateInfographic() {
    showToast("Generating image...");

    var kits = kitObjects;
    var totalKits = namMember.length;
    var displayCount = (currentMode === "all") ? Math.min(totalKits, 20) : Math.min(totalKits, 10);
    var promises = [];

    for (var i = 0; i < displayCount; i++) {
        var idx = lstMember[0][i];
        promises.push(loadKitImage(kits[idx].img));
    }

    Promise.all(promises).then(function(images) {
        var hasImages = false;
        for (var i = 0; i < images.length; i++) {
            if (images[i]) { hasImages = true; break; }
        }
        if (!drawAndDownload(images, hasImages)) {
            drawAndDownload([], false);
        }
    });
}

// Draw the infographic canvas and trigger PNG download.
// Top-10 podium layout (16:9) for home/away/third modes.
// Top-20 layout (4:3) for "all" mode.
// Returns true if download succeeded, false if canvas was tainted.
function drawAndDownload(images, tryWithImages) {
    var modeLabel = currentMode === "all" ? "ALL-TIME" : currentMode.toUpperCase();
    var kits = kitObjects;
    var totalKits = namMember.length;
    var displayCount = (currentMode === "all") ? Math.min(totalKits, 20) : Math.min(totalKits, 10);
    var colors = generateGradient(totalKits);
    var font = "-apple-system, BlinkMacSystemFont, sans-serif";

    // Canvas sizing based on display count
    var canvasW = 3200;
    var canvasH = displayCount > 10 ? 2400 : 1800;

    var canvas = document.createElement("canvas");
    canvas.width = canvasW;
    canvas.height = canvasH;
    var ctx = canvas.getContext("2d");

    // === BACKGROUND ===
    ctx.fillStyle = "#1E2F58";
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Diagonal stripe pattern
    ctx.strokeStyle = "rgba(232, 31, 62, 0.06)";
    ctx.lineWidth = 3;
    for (var s = -canvasH; s < canvasW; s += 60) {
        ctx.beginPath();
        ctx.moveTo(s, 0);
        ctx.lineTo(s + canvasH, canvasH);
        ctx.stroke();
    }

    // === TITLE SECTION (0-200px) ===
    ctx.fillStyle = "#E81F3E";
    ctx.font = "bold 96px " + font;
    ctx.textAlign = "center";
    ctx.fillText("FC DALLAS", canvasW / 2, 85);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 56px " + font;
    ctx.fillText(modeLabel + " KIT RANKINGS", canvasW / 2, 155);

    ctx.fillStyle = "#E81F3E";
    ctx.fillRect(canvasW / 2 - 140, 180, 280, 6);

    // === LAYOUT ZONES ===
    var medalColors = ["#FFD700", "#C0C0C0", "#CD7F32"];
    var medalBorders = ["rgba(255, 215, 0, 0.6)", "rgba(192, 192, 192, 0.5)", "rgba(205, 127, 50, 0.5)"];
    var podiumCount = Math.min(displayCount, 3);
    var restCount = displayCount - podiumCount;
    var titleH = 200;
    var footerH = 100;

    // Zone heights depend on how many rest rows we need
    var podiumSectionY = titleH;
    var podiumSectionH, restRow1Y, restRow1H, restRow2Y, restRow2H;
    var restRow1Count = 0, restRow2Count = 0;

    if (displayCount > 10) {
        // Two rest rows: #4-10 and #11-20
        podiumSectionH = 800;
        restRow1Count = 7; // #4-10
        restRow2Count = restCount - 7;
        restRow1H = 500;
        restRow2H = 500;
        restRow1Y = podiumSectionY + podiumSectionH;
        restRow2Y = restRow1Y + restRow1H;
    } else if (restCount > 0) {
        // One rest row
        podiumSectionH = 900;
        restRow1Count = restCount;
        restRow2Count = 0;
        restRow1H = canvasH - titleH - podiumSectionH - footerH;
        restRow1Y = podiumSectionY + podiumSectionH;
        restRow2Y = 0;
        restRow2H = 0;
    } else {
        // Only podium (1-3 kits)
        podiumSectionH = canvasH - titleH - footerH;
        restRow1Count = 0;
        restRow2Count = 0;
    }

    // === PODIUM SECTION (#1, #2, #3) ===
    // Visual order: [#2, #1, #3] left-to-right (Olympic podium style)
    var podiumOrder;
    if (podiumCount === 1) podiumOrder = [0];
    else if (podiumCount === 2) podiumOrder = [1, 0];
    else podiumOrder = [1, 0, 2];

    var podiumMarginX = 200;
    var podiumGap = 60;
    var podiumUsableW = canvasW - 2 * podiumMarginX;
    var podiumColW = Math.floor((podiumUsableW - (podiumCount - 1) * podiumGap) / podiumCount);

    for (var p = 0; p < podiumOrder.length; p++) {
        var rankIdx = podiumOrder[p];
        var idx = lstMember[0][rankIdx];
        var k = kits[idx];
        var rank = rankIdx + 1;
        var isFirst = (rankIdx === 0);

        var colX = podiumMarginX + p * (podiumColW + podiumGap);
        // #1 is elevated and taller
        var cardY = isFirst ? podiumSectionY + 20 : podiumSectionY + 80;
        var cardH = isFirst ? podiumSectionH - 40 : podiumSectionH - 100;

        // Card background
        ctx.fillStyle = "rgba(42, 64, 118, 0.7)";
        ctx.beginPath();
        canvasRoundRect(ctx, colX, cardY, podiumColW, cardH, 16);
        ctx.fill();

        // Card border with medal glow
        ctx.strokeStyle = medalBorders[rankIdx];
        ctx.lineWidth = 3;
        ctx.beginPath();
        canvasRoundRect(ctx, colX, cardY, podiumColW, cardH, 16);
        ctx.stroke();

        // Color bar at top
        ctx.fillStyle = medalColors[rankIdx];
        ctx.fillRect(colX, cardY, podiumColW, 10);

        // Jersey image
        var imgMaxH = isFirst ? 500 : 420;
        var imgMaxW = podiumColW - 80;
        var img = tryWithImages ? images[rankIdx] : null;

        if (img && img.naturalWidth > 0) {
            var scale = Math.min(imgMaxW / img.naturalWidth, imgMaxH / img.naturalHeight);
            var drawW = img.naturalWidth * scale;
            var drawH = img.naturalHeight * scale;
            var imgX = colX + (podiumColW - drawW) / 2;
            var imgY = cardY + 30;
            ctx.drawImage(img, imgX, imgY, drawW, drawH);
        }

        // Text block at bottom of card
        var textBaseY = cardY + cardH - 160;

        // Rank number
        ctx.fillStyle = medalColors[rankIdx];
        ctx.font = isFirst ? "bold 72px " + font : "bold 60px " + font;
        ctx.textAlign = "center";
        ctx.fillText("#" + rank, colX + podiumColW / 2, textBaseY + 50);

        // Team + Year
        ctx.fillStyle = "#FFFFFF";
        ctx.font = isFirst ? "bold 40px " + font : "bold 36px " + font;
        ctx.fillText(k.team + " " + k.year, colX + podiumColW / 2, textBaseY + 100);

        // Kit name
        ctx.fillStyle = "#CCCBCC";
        ctx.font = isFirst ? "italic 30px " + font : "italic 28px " + font;
        ctx.fillText(k.kit, colX + podiumColW / 2, textBaseY + 140);
    }

    // === REST ROWS ===
    // Helper to draw a row of kit cards
    function drawRestRow(startRank, count, sectionY, sectionH) {
        var restGap = 30;
        var restMarginX = 120;
        var restUsableW = canvasW - 2 * restMarginX;
        var restItemW = Math.floor((restUsableW - (count - 1) * restGap) / count);
        restItemW = Math.min(restItemW, 450);

        var restTotalW = count * restItemW + (count - 1) * restGap;
        var restStartX = Math.floor((canvasW - restTotalW) / 2);

        var restCardY = sectionY + 40;
        var restCardH = sectionH - 80;

        for (var r = 0; r < count; r++) {
            var ri = startRank + r;
            var ridx = lstMember[0][ri];
            var rk = kits[ridx];
            var rRank = ri + 1;
            var rankColor = colors[ri] || "#666666";
            var rImg = tryWithImages ? images[ri] : null;

            var itemX = restStartX + r * (restItemW + restGap);

            // Card background
            ctx.fillStyle = "rgba(42, 64, 118, 0.5)";
            ctx.beginPath();
            canvasRoundRect(ctx, itemX, restCardY, restItemW, restCardH, 12);
            ctx.fill();

            // Card border
            ctx.strokeStyle = "rgba(204, 203, 204, 0.2)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            canvasRoundRect(ctx, itemX, restCardY, restItemW, restCardH, 12);
            ctx.stroke();

            // Color bar
            ctx.fillStyle = rankColor;
            ctx.fillRect(itemX, restCardY, restItemW, 6);

            // Jersey image
            if (rImg && rImg.naturalWidth > 0) {
                var rImgMaxH = restCardH - 160;
                var rImgMaxW = restItemW - 40;
                var rScale = Math.min(rImgMaxW / rImg.naturalWidth, rImgMaxH / rImg.naturalHeight);
                var rDrawW = rImg.naturalWidth * rScale;
                var rDrawH = rImg.naturalHeight * rScale;
                var rImgX = itemX + (restItemW - rDrawW) / 2;
                var rImgY = restCardY + 20;
                ctx.drawImage(rImg, rImgX, rImgY, rDrawW, rDrawH);
            }

            // Text below image
            var rTextY = restCardY + restCardH - 120;

            ctx.fillStyle = rankColor;
            ctx.font = "bold 48px " + font;
            ctx.textAlign = "center";
            ctx.fillText("#" + rRank, itemX + restItemW / 2, rTextY + 30);

            ctx.fillStyle = "#FFFFFF";
            ctx.font = "bold 26px " + font;
            ctx.fillText(rk.team + " " + rk.year, itemX + restItemW / 2, rTextY + 66);

            ctx.fillStyle = "#CCCBCC";
            ctx.font = "italic 22px " + font;
            ctx.fillText(rk.kit, itemX + restItemW / 2, rTextY + 96);
        }
    }

    // Draw rest row(s)
    if (restRow1Count > 0) {
        drawRestRow(3, restRow1Count, restRow1Y, restRow1H);
    }
    if (restRow2Count > 0) {
        drawRestRow(10, restRow2Count, restRow2Y, restRow2H);
    }

    // === FOOTER ===
    ctx.fillStyle = "rgba(204, 203, 204, 0.5)";
    ctx.font = "24px " + font;
    ctx.textAlign = "center";
    var speedLabel = (rankingSpeed === "quick" || currentMode === "all") ? "Elo rating" : "pairwise comparison";
    var footerText = "Ranked by " + speedLabel + "  |  FC Dallas Kit Ranker";
    if (totalKits > displayCount) {
        footerText = "Top " + displayCount + " of " + totalKits + "  |  " + footerText;
    }
    ctx.fillText(footerText, canvasW / 2, canvasH - 40);

    // === EXPORT ===
    try {
        var dataUrl = canvas.toDataURL("image/png");
        var link = document.createElement("a");
        link.download = "fc-dallas-" + currentMode + "-kit-rankings.png";
        link.href = dataUrl;
        link.click();
        showToast("Image downloaded!");
        return true;
    } catch (e) {
        return false;
    }
}

function canvasRoundRect(ctx, x, y, w, h, r) {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
}

// === COPY RESULTS TO CLIPBOARD ===

function copyResultsToClipboard() {
    var modeLabel = currentMode.charAt(0).toUpperCase() + currentMode.slice(1);
    var lines = [];
    lines.push("FC Dallas " + modeLabel + " Kit Rankings");
    lines.push("================================");

    for (var i = 0; i < namMember.length; i++) {
        var idx = lstMember[0][i];
        var k = kitObjects[idx];
        lines.push("#" + (i + 1) + " - " + k.team + " " + k.year + " - " + k.kit);
    }

    lines.push("================================");
    lines.push("Ranked with FC Dallas Kit Ranker");

    var text = lines.join("\n");

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function() {
            showToast("Results copied to clipboard!");
        }, function() {
            fallbackCopy(text);
        });
    } else {
        fallbackCopy(text);
    }
}

function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try {
        document.execCommand("copy");
        showToast("Results copied to clipboard!");
    } catch(e) {
        showToast("Could not copy. Try manually.");
    }
    document.body.removeChild(ta);
}

function showToast(message) {
    var existing = document.querySelector(".copy-toast");
    if (existing) existing.remove();

    var toast = document.createElement("div");
    toast.className = "copy-toast";
    toast.textContent = message;
    document.body.appendChild(toast);

    toast.offsetHeight;
    toast.classList.add("show");

    setTimeout(function() {
        toast.classList.remove("show");
        setTimeout(function() { toast.remove(); }, 300);
    }, 2000);
}

// === HELPERS ===

function generateGradient(count) {
    var colors = [];
    for (var i = 0; i < count; i++) {
        var t = count === 1 ? 0 : i / (count - 1);
        var r, g, b;
        if (t < 0.5) {
            var p = t * 2;
            r = Math.round(0 + p * 255);
            g = Math.round(220 - p * 60);
            b = 0;
        } else {
            var p = (t - 0.5) * 2;
            r = Math.round(255 - p * 55);
            g = Math.round(160 - p * 160);
            b = 0;
        }
        colors.push("rgb(" + r + "," + g + "," + b + ")");
    }
    return colors;
}

// === INIT ===

window.onload = function() {
    updateRoundEstimates();
};
