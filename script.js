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
    var counts = { home: homeKits.length, away: awayKits.length, third: thirdKits.length };
    var modes = ["home", "away", "third"];
    for (var m = 0; m < modes.length; m++) {
        var n = counts[modes[m]];
        var rounds;
        if (rankingSpeed === "quick") {
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

    if (rankingSpeed === "quick") {
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

    for (var i = 0; i < namMember.length; i++) {
        var idx = lstMember[0][i];
        var kitData = kits[idx];
        var ranking = i + 1;
        var rankColor = colors[i] || "#666";

        var card = document.createElement("div");
        card.className = "result-card";
        card.innerHTML = '<div class="result-color-bar" style="background:' + rankColor + '"></div>' +
                         '<div class="result-rank" style="color:' + rankColor + '">#' + ranking + '</div>' +
                         '<img src="' + kitData.img + '" onerror="this.style.display=\'none\'" alt="' + kitData.team + ' ' + kitData.year + '">' +
                         '<div class="result-team">' + kitData.team + ' ' + kitData.year + '</div>' +
                         '<div class="result-kit">' + kitData.kit + '</div>';

        grid.appendChild(card);
    }

    // Actions
    var actions = document.createElement("div");
    actions.className = "modal-actions";

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

    actions.appendChild(downloadBtn);
    actions.appendChild(copyBtn);
    actions.appendChild(restartBtn);
    actions.appendChild(closeBtn);

    modal.appendChild(header);
    modal.appendChild(grid);
    modal.appendChild(actions);

    document.body.appendChild(modal);
}

// === CANVAS INFOGRAPHIC WITH KIT IMAGES ===

// Load a single image as a base64 data URI (avoids canvas taint)
function loadImageAsDataURI(src) {
    return new Promise(function(resolve, reject) {
        fetch(src)
            .then(function(response) {
                if (!response.ok) throw new Error("HTTP " + response.status);
                return response.blob();
            })
            .then(function(blob) {
                return new Promise(function(res, rej) {
                    var reader = new FileReader();
                    reader.onload = function() { res(reader.result); };
                    reader.onerror = function() { rej(reader.error); };
                    reader.readAsDataURL(blob);
                });
            })
            .then(function(dataURI) {
                var img = new Image();
                img.onload = function() { resolve(img); };
                img.onerror = function() { resolve(null); };
                img.src = dataURI;
            })
            .catch(function() {
                reject(new Error("fetch_failed"));
            });
    });
}

// Load image directly via new Image() (for Tier 2 fallback)
function loadImageDirect(src) {
    return new Promise(function(resolve, reject) {
        var img = new Image();
        img.onload = function() { resolve(img); };
        img.onerror = function() { reject(new Error("load_failed")); };
        img.src = src;
    });
}

function generateInfographic() {
    showToast("Generating image...");

    var kits = kitObjects;
    var totalKits = namMember.length;
    var dataURIPromises = [];

    for (var i = 0; i < totalKits; i++) {
        var idx = lstMember[0][i];
        dataURIPromises.push(loadImageAsDataURI(kits[idx].img));
    }

    // Tier 1: fetch → dataURI → canvas with images (works on HTTP, no taint)
    Promise.all(dataURIPromises)
        .then(function(images) {
            if (!drawAndDownload(images, true)) {
                // Safety net: if dataURI somehow taints, go text-only
                drawAndDownload([], false);
            }
        })
        .catch(function() {
            // fetch failed (likely file:// protocol)
            // Tier 2: load images directly via new Image() — may work in some browsers
            var directPromises = [];
            for (var i = 0; i < totalKits; i++) {
                var idx = lstMember[0][i];
                directPromises.push(loadImageDirect(kits[idx].img));
            }
            Promise.all(directPromises)
                .then(function(images) {
                    if (!drawAndDownload(images, true)) {
                        // Canvas tainted by cross-origin images
                        // Tier 3: text-only canvas (always works)
                        drawAndDownload([], false);
                    }
                })
                .catch(function() {
                    // Images couldn't load at all — text-only
                    drawAndDownload([], false);
                });
        });
}

// Draw the infographic canvas and trigger PNG download.
// Returns true if download succeeded, false if canvas was tainted.
function drawAndDownload(images, tryWithImages) {
    var modeLabel = currentMode.toUpperCase();
    var kits = kitObjects;
    var colors = generateGradient(namMember.length);
    var totalKits = namMember.length;

    var cols = 3;
    var rows = Math.ceil(totalKits / cols);
    var cardW = 330;
    var cardH = tryWithImages ? 300 : 100;
    var cardGap = 16;
    var padX = 40;
    var padTop = 130;
    var padBottom = 60;

    var canvasW = padX * 2 + cols * cardW + (cols - 1) * cardGap;
    var canvasH = padTop + rows * cardH + (rows - 1) * cardGap + padBottom;

    var canvas = document.createElement("canvas");
    canvas.width = canvasW;
    canvas.height = canvasH;
    var ctx = canvas.getContext("2d");

    // Background
    ctx.fillStyle = "#1E2F58";
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Diagonal stripe pattern
    ctx.strokeStyle = "rgba(232, 31, 62, 0.06)";
    ctx.lineWidth = 2;
    for (var s = -canvasH; s < canvasW; s += 40) {
        ctx.beginPath();
        ctx.moveTo(s, 0);
        ctx.lineTo(s + canvasH, canvasH);
        ctx.stroke();
    }

    // Title
    ctx.fillStyle = "#E81F3E";
    ctx.font = "bold 42px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("FC DALLAS", canvasW / 2, 55);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 28px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText(modeLabel + " KIT RANKINGS", canvasW / 2, 90);

    // Accent line
    ctx.fillStyle = "#E81F3E";
    ctx.fillRect(canvasW / 2 - 60, 104, 120, 3);

    // Kit cards
    for (var i = 0; i < totalKits; i++) {
        var idx = lstMember[0][i];
        var k = kits[idx];
        var rank = i + 1;
        var rankColor = colors[i] || "#666666";

        var col = i % cols;
        var row = Math.floor(i / cols);
        var x = padX + col * (cardW + cardGap);
        var y = padTop + row * (cardH + cardGap);

        // Card background
        ctx.fillStyle = "rgba(42, 64, 118, 0.5)";
        ctx.beginPath();
        canvasRoundRect(ctx, x, y, cardW, cardH, 8);
        ctx.fill();

        // Card border
        ctx.strokeStyle = "rgba(204, 203, 204, 0.2)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        canvasRoundRect(ctx, x, y, cardW, cardH, 8);
        ctx.stroke();

        // Color bar
        ctx.fillStyle = rankColor;
        ctx.fillRect(x, y, cardW, 8);

        if (tryWithImages) {
            // Draw kit image if available
            var img = images[i];
            if (img && img.naturalWidth > 0) {
                var imgMaxH = 180;
                var imgMaxW = cardW - 40;
                var scale = Math.min(imgMaxW / img.naturalWidth, imgMaxH / img.naturalHeight);
                var drawW = img.naturalWidth * scale;
                var drawH = img.naturalHeight * scale;
                var imgX = x + (cardW - drawW) / 2;
                var imgY = y + 15;
                ctx.drawImage(img, imgX, imgY, drawW, drawH);
            }

            // Rank number
            ctx.fillStyle = rankColor;
            ctx.font = "bold 26px -apple-system, BlinkMacSystemFont, sans-serif";
            ctx.textAlign = "left";
            ctx.fillText("#" + rank, x + 12, y + 230);

            // Team name
            ctx.fillStyle = "#FFFFFF";
            ctx.font = "bold 15px -apple-system, BlinkMacSystemFont, sans-serif";
            ctx.textAlign = "left";
            ctx.fillText(k.team + " " + k.year, x + 60, y + 228);

            // Kit name
            ctx.fillStyle = "#CCCBCC";
            ctx.font = "italic 13px -apple-system, BlinkMacSystemFont, sans-serif";
            ctx.fillText(k.kit, x + 60, y + 250);
        } else {
            // Text-only fallback
            ctx.fillStyle = rankColor;
            ctx.font = "bold 28px -apple-system, BlinkMacSystemFont, sans-serif";
            ctx.textAlign = "left";
            ctx.fillText("#" + rank, x + 10, y + 38);

            ctx.fillStyle = "#FFFFFF";
            ctx.font = "bold 13px -apple-system, BlinkMacSystemFont, sans-serif";
            ctx.fillText(k.team + " " + k.year, x + 65, y + 35);

            ctx.fillStyle = "#CCCBCC";
            ctx.font = "italic 11px -apple-system, BlinkMacSystemFont, sans-serif";
            ctx.fillText(k.kit, x + 65, y + 52);
        }
    }

    // Footer
    ctx.fillStyle = "rgba(204, 203, 204, 0.4)";
    ctx.font = "11px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "center";
    var speedLabel = rankingSpeed === "quick" ? "Elo rating" : "pairwise comparison";
    ctx.fillText("Ranked by " + speedLabel + "  |  FC Dallas Kit Ranker", canvasW / 2, canvasH - 20);

    // Try to export as PNG download
    try {
        var dataUrl = canvas.toDataURL("image/png");
        var link = document.createElement("a");
        link.download = "fc-dallas-" + currentMode + "-kit-rankings.png";
        link.href = dataUrl;
        link.click();
        showToast("Image downloaded!");
        return true;
    } catch (e) {
        // Canvas tainted — caller should retry with text-only
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
