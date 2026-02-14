// === MERGE SORT COMPARISON ENGINE ===
// Based on the pairwise comparison approach from full-kit-ranker

var namMember = [];
var lstMember = [];
var parent = [];
var rec = [];
var cmp1, cmp2;
var head1, head2;
var nrec;

var numQuestion;
var totalSize;
var finishSize;

var currentMode = null; // "home" or "away"
var kitObjects = [];

// Undo history
var undoHistory = [];

// === INITIALIZATION ===

function startRanking(mode) {
    currentMode = mode;
    namMember = buildKitList(mode);

    document.getElementById("modeSelect").style.display = "none";
    document.getElementById("battleScreen").style.display = "flex";

    initList();
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
}

function initList() {
    var n = 0;
    var mid;

    lstMember = [];
    parent = [];
    rec = [];
    undoHistory = [];

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

// === SAVE STATE FOR UNDO ===

function saveState() {
    undoHistory.push({
        lstMember: JSON.parse(JSON.stringify(lstMember)),
        parent: parent.slice(),
        rec: rec.slice(),
        cmp1: cmp1,
        cmp2: cmp2,
        head1: head1,
        head2: head2,
        nrec: nrec,
        numQuestion: numQuestion,
        finishSize: finishSize
    });
    // Keep history manageable
    if (undoHistory.length > 100) undoHistory.shift();
}

function undoLast() {
    if (undoHistory.length === 0) return;
    var state = undoHistory.pop();
    lstMember = state.lstMember;
    parent = state.parent;
    rec = state.rec;
    cmp1 = state.cmp1;
    cmp2 = state.cmp2;
    head1 = state.head1;
    head2 = state.head2;
    nrec = state.nrec;
    numQuestion = state.numQuestion;
    finishSize = state.finishSize;
    showImage();
}

// === SORT LOGIC ===

function sortList(flag) {
    saveState();

    if (flag < 0) {
        // Left chosen
        rec[nrec] = lstMember[cmp1][head1];
        head1++;
        nrec++;
        finishSize++;
    } else {
        // Right chosen
        rec[nrec] = lstMember[cmp2][head2];
        head2++;
        nrec++;
        finishSize++;
    }

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
        document.getElementById("matchupNumber").innerHTML = "Matchup #" + (numQuestion - 1) + " &middot; 100% sorted";
        document.getElementById("battleScreen").style.display = "none";
        showResults();
    } else {
        showImage();
    }
}

// === DISPLAY COMPARISON ===

function showImage() {
    var pct = Math.floor(finishSize * 100 / totalSize);
    var bar = document.getElementById("progressBar");
    bar.style.width = pct + "%";

    document.getElementById("matchupNumber").innerHTML =
        "Matchup #" + numQuestion + " &middot; " + pct + "% sorted";

    var leftData = namMember[lstMember[cmp1][head1]].split("|");
    var rightData = namMember[lstMember[cmp2][head2]].split("|");

    var leftCard = document.getElementById("leftField");
    var rightCard = document.getElementById("rightField");

    // Brief fade to signal kit change
    leftCard.style.opacity = "0";
    rightCard.style.opacity = "0";
    leftCard.innerHTML = buildCardHTML(leftData);
    rightCard.innerHTML = buildCardHTML(rightData);
    setTimeout(function() {
        leftCard.style.opacity = "1";
        rightCard.style.opacity = "1";
    }, 50);

    numQuestion++;
}

function buildCardHTML(parts) {
    var imgTag = parts[0];
    var teamYear = parts[1];
    var kitName = parts[2];

    // Extract the src from the img tag and rebuild with error handling
    var srcMatch = imgTag.match(/src='([^']*)'/);
    var imgSrc = srcMatch ? srcMatch[1] : "";

    return '<img src="' + imgSrc + '" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\';" alt="' + teamYear + '">' +
           '<div class="placeholder-kit" style="display:none;"><div class="placeholder-icon">&#128085;</div>' + teamYear + '</div>' +
           '<div class="kit-team">' + teamYear + '</div>' +
           '<div class="kit-name">' + kitName + '</div>';
}

// === RESULTS DISPLAY ===

function showResults() {
    var modeLabel = currentMode === "home" ? "HOME" : "AWAY";
    var kits = kitObjects;
    var colors = generateGradient(namMember.length);

    var modal = document.createElement("div");
    modal.className = "result-modal";

    // Header
    var header = document.createElement("div");
    header.className = "results-header";
    header.innerHTML = '<h1>FC DALLAS ' + modeLabel + ' KIT RANKINGS</h1>' +
                       '<div class="results-accent"></div>' +
                       '<p>Ranked by pairwise comparison</p>';

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

    var restartBtn = document.createElement("button");
    restartBtn.className = "modal-btn primary";
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

    actions.appendChild(restartBtn);
    actions.appendChild(closeBtn);

    modal.appendChild(header);
    modal.appendChild(grid);
    modal.appendChild(actions);

    document.body.appendChild(modal);
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
    document.getElementById("homeCount").textContent = (homeKits.length + thirdKits.length) + " kits";
    document.getElementById("awayCount").textContent = (awayKits.length + thirdKits.length) + " kits";
};
