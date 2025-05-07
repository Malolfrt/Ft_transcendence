import { state } from "../state";
import { navigateTo } from "../router";
import { translateText } from "../translate";

async function generateBracket() {
    if (!state.tournament)
        return;

    let players = [...state.tournament.players];
    shuffleArray(players);

    let bracket: { round: number; matchups: { player1: string; player2: string | null; winner?: string }[] }[] = [];
    let roundNumber = 1;

    while (players.length > 1) {
        let matchups: { player1: string; player2: string | null }[] = [];

        while (players.length >= 2) {
            let player1 = players.shift()!;
            let player2 = players.shift()!;
            matchups.push({ player1, player2 });
        }

        if (players.length === 1) {
            matchups.push({ player1: players.shift()!, player2: null });
        }

        bracket.push({ round: roundNumber, matchups });
        roundNumber++;
    }

    state.tournament.bracket = bracket;
}

function getNextMatch() {
    if (!state.tournament) return null;

	if (state.tournament.winner) {
        return null;
    }

    for (let round of state.tournament.bracket) {
        for (let match of round.matchups) {
            if (!match.winner && match.player2) {
                return match;
            }
        }
    }

    const lastRound = state.tournament.bracket[state.tournament.bracket.length - 1];
    if (lastRound.matchups.length === 1 && !lastRound.matchups[0].winner) {
        return lastRound.matchups[0];
    }

    return null;
}


function shuffleArray(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
        const j: number = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}


export default async function TournamentBracket(): Promise<HTMLElement> {


const textToTranslate: string[] = [
    "Champion du tournoi",
    "Bracket du Tournoi",
    "Format",
    "joueurs",
    "Mode",
    "Matchs",
    "Terminé",
    "restant",
    "Lancer le prochain match",
    "Tournoi terminé",
    "minutes",
    "points"
];

const [
    translatedWinnerOfTournament,
    translatedBracketOfTournament,
    translatedFormat,
    translatedPlayers,
    translatedMode,
    translatedMatchs,
    translatedFinish,
    translatedRest,
    translatedStartNextMatch,
    translatedTournamentFinished,
    translatedMinutes,
    translatedPoints
] = await Promise.all(textToTranslate.map(text => translateText(text)));

    if (!state.tournament && localStorage.getItem('tournamentData')) {
        try {
            state.tournament = JSON.parse(localStorage.getItem('tournamentData')!);
        } catch (error) {
            console.error("Erreur lors de la restauration des données:", error);
        }
    }

    if (!state.tournament || !state.tournament.players.length) {
        navigateTo(new Event("click"), "/tournament-settings");
        return document.createElement("div");
    }
    
    localStorage.setItem('currentPage', 'tournament-bracket');
    localStorage.setItem('tournamentData', JSON.stringify(state.tournament));

    const container = document.createElement("div");
    container.className = "absolute inset-0 flex flex-col items-center bg-gradient-to-r from-indigo-950 via-purple-900 to-indigo-950 text-white";

    const header = document.createElement("div");
    header.className = "w-full max-w-3xl bg-black bg-opacity-40 backdrop-blur-sm p-5 rounded-2xl shadow-2xl border border-purple-500/30 mt-6 mb-4 mx-auto";
    
    const headerContent = document.createElement("div");
    headerContent.className = "flex flex-col items-center";
    
    if (state.tournament.winner) {
        const winnerBadge = document.createElement("div");
        winnerBadge.className = "flex items-center justify-center mb-3 bg-gradient-to-r from-yellow-900/40 to-amber-800/40 rounded-lg border border-yellow-500/40 py-3 px-5";
        
        const trophyIcon = document.createElement("span");
        trophyIcon.innerHTML = "🏆";
        trophyIcon.className = "text-2xl mr-3";
        
        const winnerHTML = document.createElement("div");
        winnerHTML.className = "flex flex-col";
        
        const winnerLabel = document.createElement("span");
        winnerLabel.innerHTML = translatedWinnerOfTournament;
        winnerLabel.className = "text-sm text-yellow-300";
        
        const winnerName = document.createElement("span");
        winnerName.innerHTML = state.tournament.winner;
        winnerName.className = "text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500";
        
        winnerHTML.append(winnerLabel, winnerName);
        winnerBadge.append(trophyIcon, winnerHTML);
        headerContent.appendChild(winnerBadge);
    }
    
    const title = document.createElement("h1");
    title.innerHTML = `🏆 ${translatedBracketOfTournament}`;
    title.className = "text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 text-center";

    headerContent.appendChild(title);
    header.appendChild(headerContent);

    if (!state.tournament.bracket.length) {
        generateBracket();
    }

    const rounds = state.tournament.bracket.length;
    const totalPlayers = state.tournament.players.length;
    
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    const headerHeight = 120;
    const infoHeight = 150;
    const availableHeight = viewportHeight - headerHeight - infoHeight - 60;
    
    const maxCanvasWidth = Math.min(viewportWidth * 0.92 - 32, 1400);
    
    let horizontalSpacing, matchWidth;
    
    if (rounds <= 2) {
        horizontalSpacing = Math.min(220, maxCanvasWidth / 3);
        matchWidth = Math.min(170, horizontalSpacing * 0.75);
    } else if (rounds === 3) {
        horizontalSpacing = Math.min(200, maxCanvasWidth / 4);
        matchWidth = Math.min(160, horizontalSpacing * 0.75);
    } else {
        horizontalSpacing = Math.min(180, maxCanvasWidth / (rounds + 1));
        matchWidth = Math.min(150, horizontalSpacing * 0.75);
    }
    
    let matchHeight, verticalSpacing;
    const maxMatchesInRound = Math.pow(2, rounds - 1);
    
    if (totalPlayers >= 16) {
        matchHeight = 36;
        verticalSpacing = 24;
    } else if (totalPlayers >= 9) {
        matchHeight = 38;
        verticalSpacing = 28;
    } else if (totalPlayers > 4) {
        matchHeight = 46;
        verticalSpacing = 36;
    } else {
        matchHeight = 54;
        verticalSpacing = 45;
    }
    
    const canvasWidth = Math.min(rounds * horizontalSpacing + matchWidth + 140, maxCanvasWidth);
    
    const matchesInFirstRound = state.tournament.bracket[0] ? state.tournament.bracket[0].matchups.length : 0;
    const minHeightNeeded = (matchesInFirstRound * matchHeight) + ((matchesInFirstRound - 1) * verticalSpacing) + 80;
    
    let adjustedAvailableHeight = availableHeight;
    if (totalPlayers > 8) {
        adjustedAvailableHeight = Math.max(availableHeight, Math.min(minHeightNeeded, viewportHeight * 0.8));
    }
    
    const minCanvasHeight = Math.min(400, adjustedAvailableHeight);
    const canvasHeight = Math.max(minHeightNeeded, minCanvasHeight);

    const canvasContainer = document.createElement("div");
    canvasContainer.className = "bg-black bg-opacity-30 backdrop-blur-sm p-4 sm:p-5 rounded-2xl shadow-xl border border-indigo-500/30 flex justify-center items-center overflow-hidden";
    canvasContainer.style.maxWidth = "calc(100vw - 24px)";
    
    if (totalPlayers > 8) {
        canvasContainer.style.overflowY = "auto";
        canvasContainer.style.maxHeight = `${Math.min(viewportHeight * 0.75, 850)}px`;
        canvasContainer.style.overflowX = "hidden";
    } else {
        canvasContainer.style.minHeight = "400px";
        canvasContainer.style.maxHeight = `${canvasHeight + 40}px`;
    }
    
    const canvas = document.createElement("canvas");
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    canvas.className = "rounded-lg shadow-xl";

    canvas.style.maxWidth = "100%";
    canvas.style.height = "auto";
    canvas.style.objectFit = "contain";

    const ctx: CanvasRenderingContext2D | null = canvas.getContext("2d");

    if (ctx) {
        drawBracket(ctx, canvas.width, canvas.height);
    }
    
    canvasContainer.appendChild(canvas);
    
    const infoContainer = document.createElement("div");
    infoContainer.className = "mt-4 bg-black bg-opacity-30 backdrop-blur-sm p-4 sm:p-5 rounded-2xl shadow-xl border border-indigo-500/30 w-full max-w-3xl flex flex-wrap justify-between gap-4 mx-auto";
    
    const formatInfo = document.createElement("div");
    formatInfo.className = "flex flex-col items-center";
    
    const formatIcon = document.createElement("div");
    formatIcon.className = "text-2xl mb-2 text-purple-300";
    formatIcon.innerHTML = "🏠";
    
    const formatTitle = document.createElement("div");
    formatTitle.className = "text-sm text-indigo-300 mb-1";
    formatTitle.innerHTML = translatedFormat;
    const formatValue = document.createElement("div");
    formatValue.className = "text-lg font-medium text-white";
    formatValue.innerHTML = `${state.tournament.players.length} ${translatedPlayers}`;
    
    formatInfo.append(formatIcon, formatTitle, formatValue);
    
    const modeInfo = document.createElement("div");
    modeInfo.className = "flex flex-col items-center";
    
    const modeIcon = document.createElement("div");
    modeIcon.className = "text-2xl mb-2 text-purple-300";
    modeIcon.innerHTML = "🎯";
    
    const modeTitle = document.createElement("div");
    modeTitle.className = "text-sm text-indigo-300 mb-1";
    modeTitle.innerHTML = translatedMode;
    
    const modeValue = document.createElement("div");
    modeValue.className = "text-lg font-medium text-white";
    modeValue.innerHTML = `${state.tournament.target} ${translatedPoints}`;
    
    modeInfo.append(modeIcon, modeTitle, modeValue);
    
    const matchesInfo = document.createElement("div");
    matchesInfo.className = "flex flex-col items-center";
    
    const matchesIcon = document.createElement("div");
    matchesIcon.className = "text-2xl mb-2 text-purple-300";
    matchesIcon.innerHTML = "🎮";
    
    const matchesTitle = document.createElement("div");
    matchesTitle.className = "text-sm text-indigo-300 mb-1";
    matchesTitle.innerHTML = translatedMatchs;
    let matchesRemaining = 0;
    state.tournament.bracket.forEach(round => {
        round.matchups.forEach(match => {
            if (!match.winner && match.player1 && match.player2) {
                matchesRemaining++;
            }
        });
    });
    
    const matchesValue = document.createElement("div");
    matchesValue.className = "text-lg font-medium text-white";
    matchesValue.innerHTML = state.tournament.winner 
        ? translatedFinish
        : `${matchesRemaining} ${translatedRest}${matchesRemaining > 1 ? 's' : ''}`;

    matchesInfo.append(matchesIcon, matchesTitle, matchesValue);
    
    infoContainer.append(formatInfo, modeInfo, matchesInfo);
    
    if (!state.tournament.winner) {
        const buttonContainer = document.createElement("div");
        buttonContainer.className = "w-full flex justify-center mt-4 mb-6";
        
        const playNextMatchButton = document.createElement("button");
        playNextMatchButton.className = "px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white rounded-xl shadow-xl transition-all font-medium flex items-center";
        playNextMatchButton.innerHTML = `<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        ${translatedStartNextMatch}`;

        playNextMatchButton.onclick = () => {
            const nextMatch = getNextMatch();
            if (nextMatch) {
                state.tournament!.currentMatch = nextMatch;
                localStorage.setItem('currentMatchData', JSON.stringify(nextMatch));
                navigateTo(new Event("click"), "/tournament-game");
            } else {
                alert(`🏆 ${translatedTournamentFinished}`);
            }
        };
        buttonContainer.appendChild(playNextMatchButton);
        container.appendChild(buttonContainer);
    }
    
    container.append(header, canvasContainer, infoContainer);
    
    window.addEventListener('resize', () => {
        const canvas = document.querySelector('canvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                drawBracket(ctx, canvas.width, canvas.height);
            }
        }
    });
    
    return container;
}

export async function drawBracket(ctx: CanvasRenderingContext2D, width: number, height: number) {
    if (!state.tournament) return;

    const textToTranslate: string[] = [
        "En attente..."
    ];
    const [
        translatedWaiting
    ] = await Promise.all(textToTranslate.map(text => translateText(text)));
    ctx.clearRect(0, 0, width, height);
    
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#1e1b4b20");
    gradient.addColorStop(0.5, "#581c8720");
    gradient.addColorStop(1, "#1e1b4b20");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    const pointSpacing = width > 800 ? 20 : 40;
    ctx.fillStyle = "#8b5cf610";
    for (let x = 0; x < width; x += pointSpacing) {
        for (let y = 0; y < height; y += pointSpacing) {
            ctx.beginPath();
            ctx.arc(x, y, 1, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    const bracket = state.tournament.bracket;
    const rounds = bracket.length;
    const totalPlayers = state.tournament.players.length;
    let matchHeight, matchWidth;
    
    if (totalPlayers >= 16) {
        matchHeight = 36;
        matchWidth = width / (rounds + 2) * 0.8;
    } else if (totalPlayers >= 9) {
        matchHeight = 38;
        matchWidth = width / (rounds + 2) * 0.8;
    } else {
        matchHeight = height / Math.max(totalPlayers, 4) * 0.7;
        matchWidth = width / (rounds + 2) * 0.8;
    }
    
    const horizontalSpacing = width / (rounds + 1);
    
    const centerY = totalPlayers > 8 
        ? matchHeight * totalPlayers / 4
        : height / 2;

    const fontSize = totalPlayers >= 12
        ? Math.max(12, Math.min(13, matchHeight / 3))
        : Math.max(13, Math.min(15, matchHeight / 3));

    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = "center";
    
    const titleGradient = ctx.createLinearGradient(0, 0, width, 0);
    titleGradient.addColorStop(0, "#a5b4fc");
    titleGradient.addColorStop(1, "#c4b5fd");
    ctx.fillStyle = titleGradient;
    
    for (let i = 0; i < rounds; i++) {
        const roundTitle = i === rounds - 1 ? "Finale" : 
                         i === rounds - 2 ? "Demi-finales" : 
                         i === rounds - 3 ? "Quarts de finale" : 
                         `Tour ${i + 1}`;
        const x = i * horizontalSpacing + 70 + matchWidth/2;
        ctx.fillText(roundTitle, x, 25);
    }
    
    ctx.textAlign = "left";

    let positions: { x: number; y: number }[][] = [];

    const firstRoundMatches = bracket[0] ? bracket[0].matchups.length : 0;
    let verticalSpacing;
    if (totalPlayers >= 16) {
        verticalSpacing = 24;
    } else if (totalPlayers >= 9) {
        verticalSpacing = 28;
    } else if (totalPlayers > 4) {
        verticalSpacing = 36;
    } else {
        verticalSpacing = 45;
    }
    
    const totalHeight = firstRoundMatches * matchHeight + (firstRoundMatches - 1) * verticalSpacing;
    let startY = centerY - totalHeight / 2;
    
    if (totalPlayers > 8) {
        startY = 40;
    }

    for (let roundIndex = 0; roundIndex < rounds; roundIndex++) {
        const round = bracket[roundIndex];
        const matchesInRound: number = round.matchups.length;

        positions[roundIndex] = [];
        
        const roundTotalHeight = matchesInRound * matchHeight + (matchesInRound - 1) * verticalSpacing;
        let roundStartY = centerY - roundTotalHeight / 2;
        
        if (totalPlayers > 8) {
            roundStartY = startY + (roundIndex === 0 ? 0 : 20);
        }

        for (let matchIndex = 0; matchIndex < matchesInRound; matchIndex++) {
            const match = round.matchups[matchIndex];

            let x = roundIndex * horizontalSpacing + 70;
            let y = roundStartY + matchIndex * (matchHeight + verticalSpacing);

            if (roundIndex > 0) {
                const prevRoundMatchCount = positions[roundIndex - 1].length;
                const matchesPerCurrentMatch = prevRoundMatchCount / matchesInRound;
                
                if (matchesPerCurrentMatch >= 2) {
                    const startIdx = matchIndex * matchesPerCurrentMatch;
                    const endIdx = startIdx + matchesPerCurrentMatch - 1;
                    
                    if (positions[roundIndex - 1][startIdx] && positions[roundIndex - 1][endIdx]) {
                        const prevY1 = positions[roundIndex - 1][startIdx].y;
                        const prevY2 = positions[roundIndex - 1][endIdx].y;
                        y = (prevY1 + prevY2 + matchHeight) / 2 - matchHeight/2;
                    }
                }
            }

            positions[roundIndex].push({ x, y });

            const matchGradient = ctx.createLinearGradient(x, y, x + matchWidth, y + matchHeight);
            matchGradient.addColorStop(0, "#1e293b99");
            matchGradient.addColorStop(1, "#0f172a99");
            
            ctx.fillStyle = matchGradient;
            ctx.beginPath();
            ctx.roundRect(x, y, matchWidth, matchHeight, 8);
            ctx.fill();
            
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            
            const now = Date.now() / 1000;
            const borderGradient = ctx.createLinearGradient(x, y, x + matchWidth, y + matchHeight);
            
            if (match.winner) {
                const shiftAmount = (Math.sin(now) + 1) / 2;
                borderGradient.addColorStop(0, "#fbbf24");
                borderGradient.addColorStop(shiftAmount, "#f59e0b");
                borderGradient.addColorStop(1, "#d97706");
            } else {
                borderGradient.addColorStop(0, "#6366f1");
                borderGradient.addColorStop(1, "#8b5cf6");
            }
            
            ctx.strokeStyle = borderGradient;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(x, y, matchWidth, matchHeight, 8);
            ctx.stroke();
            
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;

            ctx.beginPath();
            ctx.moveTo(x, y + matchHeight/2);
            ctx.lineTo(x + matchWidth, y + matchHeight/2);
            ctx.strokeStyle = "#6366f140";
            ctx.stroke();

            ctx.font = `bold ${fontSize}px Arial`;
            
            if (match.player1 === match.winner) {
                const winnerGradient = ctx.createLinearGradient(x, y, x + matchWidth, y + matchHeight/2);
                winnerGradient.addColorStop(0, "rgba(251, 191, 36, 0.3)");
                winnerGradient.addColorStop(1, "rgba(245, 158, 11, 0.3)");
                
                ctx.fillStyle = winnerGradient;
                ctx.beginPath();
                ctx.roundRect(x, y, matchWidth, matchHeight/2, [8, 8, 0, 0]);
                ctx.fill();
                
                ctx.fillStyle = "#fcd34d";
            } else {
                ctx.fillStyle = "#e0e7ff";
            }
            
            const player1Text = match.player1 || "En attente...";
            const player1Y = y + matchHeight/4 + 6;
            ctx.fillText(player1Text, x + 14, player1Y);
            
            if (match.player2 === match.winner) {
                const winnerGradient = ctx.createLinearGradient(x, y + matchHeight/2, x + matchWidth, y + matchHeight);
                winnerGradient.addColorStop(0, "rgba(251, 191, 36, 0.3)");
                winnerGradient.addColorStop(1, "rgba(245, 158, 11, 0.3)");
                
                ctx.fillStyle = winnerGradient;
                ctx.beginPath();
                ctx.roundRect(x, y + matchHeight/2, matchWidth, matchHeight/2, [0, 0, 8, 8]);
                ctx.fill();
                
                ctx.fillStyle = "#fcd34d";
            } else {
                ctx.fillStyle = "#e0e7ff";
            }
            
            const player2Text = match.player2 || "En attente...";
            const player2Y = y + 3*matchHeight/4 + 6;
            ctx.fillText(player2Text, x + 14, player2Y);

            if (match.winner) {
                if (match.player1 === match.winner) {
                    ctx.beginPath();
                    ctx.roundRect(x, y, matchWidth, matchHeight/2, [8, 8, 0, 0]);
                    ctx.strokeStyle = "#fbbf24";
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                } else if (match.player2 === match.winner) {
                    ctx.beginPath();
                    ctx.roundRect(x, y + matchHeight/2, matchWidth, matchHeight/2, [0, 0, 8, 8]);
                    ctx.strokeStyle = "#fbbf24";
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }
            }

            if (roundIndex > 0) {
                const matchesPerCurrentMatch = positions[roundIndex - 1].length / matchesInRound;
                const startIdx = matchIndex * matchesPerCurrentMatch;
                const endIdx = startIdx + matchesPerCurrentMatch - 1;
                
                if (positions[roundIndex - 1][startIdx] && positions[roundIndex - 1][endIdx]) {
                    const prev1 = positions[roundIndex - 1][startIdx];
                    const prev2 = positions[roundIndex - 1][endIdx];
                    
                    const lineGradient = ctx.createLinearGradient(
                        prev1.x + matchWidth, prev1.y + matchHeight / 2,
                        x, y + matchHeight / 2
                    );
                    
                    if (match.winner) {
                        lineGradient.addColorStop(0, "#fbbf2480");
                        lineGradient.addColorStop(1, "#f59e0b80");
                    } else {
                        lineGradient.addColorStop(0, "#6366f180");
                        lineGradient.addColorStop(1, "#8b5cf680");
                    }
                    
                    ctx.strokeStyle = lineGradient;
                    ctx.lineWidth = 2;
                    
                    const junctionX = prev1.x + matchWidth + 30;
                    const junctionY = (prev1.y + prev2.y + matchHeight) / 2;
                    
                    ctx.beginPath();
                    ctx.moveTo(prev1.x + matchWidth, prev1.y + matchHeight / 2);
                    ctx.lineTo(junctionX, prev1.y + matchHeight / 2);
                    ctx.stroke();
                    
                    ctx.beginPath();
                    ctx.moveTo(junctionX, prev1.y + matchHeight / 2);
                    ctx.lineTo(junctionX, junctionY);
                    ctx.stroke();
                    
                    ctx.beginPath();
                    ctx.moveTo(prev2.x + matchWidth, prev2.y + matchHeight / 2);
                    ctx.lineTo(junctionX, prev2.y + matchHeight / 2);
                    ctx.stroke();
                    
                    ctx.beginPath();
                    ctx.moveTo(junctionX, prev2.y + matchHeight / 2);
                    ctx.lineTo(junctionX, junctionY);
                    ctx.stroke();
                    
                    ctx.beginPath();
                    ctx.moveTo(junctionX, junctionY);
                    ctx.lineTo(x, y + matchHeight / 2);
                    ctx.stroke();
                    
                    ctx.beginPath();
                    ctx.arc(junctionX, junctionY, 4, 0, Math.PI * 2);
                    ctx.fillStyle = lineGradient;
                    ctx.fill();
                }
            }
        }
    }
}

function updateBracket(winner: string) {
    if (!state.tournament) return;

    for (let roundIndex = 0; roundIndex < state.tournament.bracket.length; roundIndex++) {
        const round = state.tournament.bracket[roundIndex];

        for (let match of round.matchups) {
            if (!match.winner && match.player2) {
                match.winner = winner;

                if (roundIndex + 1 < state.tournament.bracket.length) {
                    let nextRound = state.tournament.bracket[roundIndex + 1];

                    for (let nextMatch of nextRound.matchups) {
                        if (!nextMatch.player1) {
                            nextMatch.player1 = winner;
                            break;
                        } else if (!nextMatch.player2) {
                            nextMatch.player2 = winner;
                            break;
                        }
                    }
                }

                drawBracket(document.querySelector("canvas")!.getContext("2d")!,
                            document.querySelector("canvas")!.width,
                            document.querySelector("canvas")!.height);
                return;
            }
        }
    }
}
