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
        generateCanvasPoster();
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

// === CANVAS POSTER GENERATION ===

function generateCanvasPoster() {
    var overlay = document.getElementById("loadingOverlay");
    overlay.style.display = "flex";

    var modeLabel = currentMode === "home" ? "HOME" : "AWAY";
    var kits = kitObjects;

    // Color gradient from green (best) to red (worst)
    var colors = generateGradient(namMember.length);

    var cols = 5;
    var rows = Math.ceil(namMember.length / cols);
    var cardW = 200;
    var cardH = 280;
    var gap = 12;
    var pad = 30;
    var headerH = 80;

    var canvasW = (cols * cardW) + ((cols - 1) * gap) + (pad * 2);
    var canvasH = headerH + (rows * cardH) + ((rows - 1) * gap) + (pad * 2);

    var canvas = document.createElement("canvas");
    canvas.width = canvasW;
    canvas.height = canvasH;
    var ctx = canvas.getContext("2d");

    // Background
    ctx.fillStyle = "#0c1220";
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Header
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 36px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("FC DALLAS " + modeLabel + " KIT RANKINGS", canvasW / 2, pad + headerH / 2 - 8);

    // Subtitle line
    ctx.fillStyle = "#8a94a6";
    ctx.font = "14px sans-serif";
    ctx.fillText("Ranked by pairwise comparison", canvasW / 2, pad + headerH / 2 + 18);

    // Red accent line
    ctx.fillStyle = "#e81f3e";
    ctx.fillRect(canvasW / 2 - 60, pad + headerH - 8, 120, 3);

    // Load all images then draw
    var imagePromises = [];
    for (var i = 0; i < namMember.length; i++) {
        var idx = lstMember[0][i];
        var kitData = kits[idx];
        imagePromises.push(loadImageSafe(kitData.img));
    }

    Promise.all(imagePromises).then(function(images) {
        for (var i = 0; i < namMember.length; i++) {
            var idx = lstMember[0][i];
            var kitData = kits[idx];
            var ranking = i + 1;
            var col = i % cols;
            var row = Math.floor(i / cols);
            var x = pad + col * (cardW + gap);
            var y = pad + headerH + row * (cardH + gap);
            var rankColor = colors[i] || "#666";

            // Card background
            ctx.fillStyle = "rgba(255,255,255,0.04)";
            roundRect(ctx, x, y, cardW, cardH, 8);
            ctx.fill();

            // Top color bar
            ctx.fillStyle = rankColor;
            ctx.fillRect(x, y, cardW, 6);

            // Rank number
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 22px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("#" + ranking, x + cardW / 2, y + 32);

            // Kit image
            var img = images[i];
            if (img) {
                var imgAreaH = 150;
                var imgAreaW = cardW - 30;
                var scale = Math.min(imgAreaW / img.width, imgAreaH / img.height);
                var drawW = img.width * scale;
                var drawH = img.height * scale;
                var drawX = x + (cardW - drawW) / 2;
                var drawY = y + 48 + (imgAreaH - drawH) / 2;
                ctx.drawImage(img, drawX, drawY, drawW, drawH);
            } else {
                // Placeholder rectangle
                ctx.fillStyle = "rgba(255,255,255,0.06)";
                roundRect(ctx, x + 30, y + 58, cardW - 60, 130, 4);
                ctx.fill();
                ctx.fillStyle = "rgba(255,255,255,0.2)";
                ctx.font = "12px sans-serif";
                ctx.fillText("No Image", x + cardW / 2, y + 125);
            }

            // Team name + year
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 13px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(kitData.team + " " + kitData.year, x + cardW / 2, y + 222);

            // Kit name
            ctx.fillStyle = "#8a94a6";
            ctx.font = "italic 11px sans-serif";
            ctx.fillText(kitData.kit, x + cardW / 2, y + 242);

        }

        var dataUrl;
        try {
            dataUrl = canvas.toDataURL("image/png");
        } catch (e) {
            overlay.style.display = "none";
            alert("Unable to export image. Try opening this page via a local web server instead of file://.");
            return;
        }
        overlay.style.display = "none";
        showResultModal(dataUrl);
    }).catch(function(err) {
        console.error(err);
        overlay.style.display = "none";
        alert("Error generating ranking image. Check console for details.");
    });
}

// === HELPERS ===

function loadImageSafe(src) {
    return new Promise(function(resolve) {
        var img = new Image();
        img.onload = function() { resolve(img); };
        img.onerror = function() { resolve(null); };
        img.src = src;
    });
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function generateGradient(count) {
    var colors = [];
    for (var i = 0; i < count; i++) {
        var t = count === 1 ? 0 : i / (count - 1);
        // Green -> Yellow -> Orange -> Red
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

function showResultModal(dataUrl) {
    var modal = document.createElement("div");
    modal.className = "result-modal";

    var img = new Image();
    img.src = dataUrl;

    var actions = document.createElement("div");
    actions.className = "modal-actions";

    var downloadBtn = document.createElement("button");
    downloadBtn.className = "modal-btn primary";
    downloadBtn.textContent = "Download Image";
    downloadBtn.onclick = function(e) {
        e.stopPropagation();
        var a = document.createElement("a");
        a.href = dataUrl;
        a.download = "fc-dallas-" + currentMode + "-kit-ranking.png";
        a.click();
    };

    var closeBtn = document.createElement("button");
    closeBtn.className = "modal-btn";
    closeBtn.textContent = "Close";
    closeBtn.onclick = function() {
        document.body.removeChild(modal);
        document.getElementById("modeSelect").style.display = "flex";
        resetState();
    };

    var restartBtn = document.createElement("button");
    restartBtn.className = "modal-btn";
    restartBtn.textContent = "Rank Again";
    restartBtn.onclick = function(e) {
        e.stopPropagation();
        document.body.removeChild(modal);
        startRanking(currentMode);
    };

    actions.appendChild(downloadBtn);
    actions.appendChild(restartBtn);
    actions.appendChild(closeBtn);

    var hint = document.createElement("div");
    hint.className = "modal-hint";
    hint.textContent = "You can also right-click the image to save it";

    modal.appendChild(img);
    modal.appendChild(actions);
    modal.appendChild(hint);

    document.body.appendChild(modal);
}

// === INIT ===

window.onload = function() {
    document.getElementById("homeCount").textContent = (homeKits.length + thirdKits.length) + " kits";
    document.getElementById("awayCount").textContent = (awayKits.length + thirdKits.length) + " kits";
};
