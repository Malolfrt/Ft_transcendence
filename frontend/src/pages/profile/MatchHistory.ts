import { state } from "../../state";
import { translateText } from "../../translate";

export default async function MatchHistory(userId?: number): Promise<HTMLElement> {

        const textsToTranslate: string[] = [
            "Historique",
            "Matchs",
            "Tournoi",
            "Utilisateur non authentifié.",
            "Chargement...",
            "Aucun match trouvé.",
            "Gagnant",
            "Erreur de chargement des matchs.",
            "Aucun tournoi trouvé.",
            "Non classé",
            "ème",
            "du",
            "Erreur de chargement des tournois.",
            "1er",
            "2ème",
            "3ème"
        ];
    
        const [
            translatedHistory,
            translatedMatchs,
            translatedTournament,
            translatedUserNotAuthentificate,
            translatedLoading,
            translatedMatchNotFound,
            translatedWin,
            translatedErrorLoadingMatches,
            translatedTournamentNotFound,
            translatedUnclassified,
            translatedPos,
            translatedOf,
            translatedErrorLoadingTournament,
            translatedFirstPos,
            translatedSecondPos,
            translatedThirdPos
        ] = await Promise.all(textsToTranslate.map(text => translateText(text)));

    const container: HTMLDivElement = document.createElement("div");
    container.className = "bg-gray-800 text-white rounded-xl shadow-lg p-6 flex flex-col h-full";

    const title: HTMLHeadingElement = document.createElement("h2");
    title.innerHTML = `${translatedHistory}`;
    title.className = "text-2xl font-bold mb-4 text-center";

    let activeTab: "matches" | "tournaments" = "matches";

    const tabsContainer: HTMLDivElement = document.createElement("div");
    tabsContainer.className = "flex space-x-2 mb-4 justify-center";

    const tabMatches: HTMLButtonElement = document.createElement("button");
    tabMatches.innerHTML = translatedMatchs;
    tabMatches.className = "px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold";

    const tabTournaments: HTMLButtonElement = document.createElement("button");
    tabTournaments.innerHTML = translatedTournament;
    tabTournaments.className = "px-4 py-2 text-white bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold";

    const historyContainer: HTMLDivElement = document.createElement("div");
    historyContainer.className = "flex flex-col gap-2 overflow-y-auto max-h-64 scrollbar-thin scrollbar-thumb-gray-700";

    const targetUserId = userId || state.user?.id;
    if (!targetUserId) {
        historyContainer.innerHTML = `<p class='text-red-500 text-center py-4'>${translatedUserNotAuthentificate}</p>`;
        return container;
    }

    tabMatches.addEventListener("click", () => {
        if (activeTab !== "matches") {
            activeTab = "matches";
            tabMatches.classList.remove("bg-gray-700");
            tabMatches.classList.add("bg-blue-600");
            tabTournaments.classList.remove("bg-blue-600");
            tabTournaments.classList.add("bg-gray-700");
            historyContainer.innerHTML = "";
            fetchMatchHistory();
        }
    });

    tabTournaments.addEventListener("click", () => {
        if (activeTab !== "tournaments") {
            activeTab = "tournaments";
            tabTournaments.classList.remove("bg-gray-700");
            tabTournaments.classList.add("bg-blue-600");
            tabMatches.classList.remove("bg-blue-600");
            tabMatches.classList.add("bg-gray-700");
            historyContainer.innerHTML = "";
            fetchTournamentHistory();
        }
    });

    async function fetchMatchHistory() {
        try {
            historyContainer.innerHTML = `<p class='text-white text-center py-2'>${translatedLoading}</p>`;
            
            let profileUsername = "";
            if (userId && userId !== state.user?.id) {
                try {
                    const userResponse = await fetch(`/api/users/${targetUserId}`);
                    if (userResponse.ok) {
                        const userData = await userResponse.json();
                        profileUsername = userData.username;
                    }
                } catch (e) {
                    profileUsername = "Joueur";
                }
            } else {
                profileUsername = state.user.username;
            }
            
            const response: Response = await fetch(`/api/matches?userId=${targetUserId}`);
            if (!response.ok) throw new Error("Erreur API");
            const matches = await response.json();

            historyContainer.innerHTML = "";
            if (!Array.isArray(matches) || matches.length === 0) {
                historyContainer.innerHTML = `<p class='text-white text-center py-4'>${translatedMatchNotFound}</p>`;
                return;
            }

            matches.forEach(match => {
                const profileIsWinner = match.winner_id == targetUserId || match.winner_name === profileUsername;
                
                const matchItem: HTMLDivElement = document.createElement("div");
                matchItem.className = `p-3 rounded-lg flex flex-col ${profileIsWinner ? "bg-blue-600" : "bg-red-600"}`;

                const matchDate: string = new Date(match.played_at).toLocaleDateString();
                
                const matchHeader: HTMLDivElement = document.createElement("div");
                matchHeader.className = "flex justify-between items-center";
                
                const dateSpan: HTMLSpanElement = document.createElement("span");
                dateSpan.innerHTML = matchDate;
                dateSpan.className = "text-xs text-white opacity-80";
                
                const matchResult: HTMLSpanElement = document.createElement("span");
                matchResult.innerHTML = `${translatedWin}: ${match.winner_name}`;
                matchResult.className = "text-xs font-semibold";
                
                matchHeader.append(dateSpan, matchResult);
                
                const matchPlayers: HTMLDivElement = document.createElement("div");
                matchPlayers.className = "text-sm font-medium mt-1";
                matchPlayers.innerHTML = `${match.player1_name} VS ${match.player2_name}`;
                
                matchItem.append(matchHeader, matchPlayers);
                historyContainer.appendChild(matchItem);
            });
        } catch (error) {
            historyContainer.innerHTML = `<p class='text-red-500 text-center py-4'>${translatedErrorLoadingMatches}</p>`;
        }
    }

    async function fetchTournamentHistory(): Promise<void> {
        try {
            historyContainer.innerHTML = `<p class='text-white'>${translatedLoading}</p>`;
            
            let profileUsername = "";
            if (userId && userId !== state.user?.id) {
                try {
                    const userResponse = await fetch(`/api/users/${targetUserId}`);
                    if (userResponse.ok) {
                        const userData = await userResponse.json();
                        profileUsername = userData.username;
                    } else {
                        console.error("Erreur API lors de la récupération de l'utilisateur:", await userResponse.text());
                    }
                } catch (e) {
                    profileUsername = "Joueur";
                }
            } else {
                profileUsername = state.user.username;
            }
            
            const response: Response = await fetch(`/api/tournaments?userId=${targetUserId}`);
            if (!response.ok) {
                console.error("Erreur API lors de la récupération des tournois:", await response.text());
                throw new Error("Erreur API");
            }
    
            const tournaments = await response.json();
            
            historyContainer.innerHTML = "";
            if (!Array.isArray(tournaments) || tournaments.length === 0) {
                historyContainer.innerHTML = `<p class='text-white'>${translatedTournamentNotFound}</p>`;
                return;
            }
    
            const allPlayerIds = new Set<number>();
            const usernameToIdMap = new Map<string, number>();
            
            if (userId)
                usernameToIdMap.set(profileUsername, Number(userId));
            
            tournaments.forEach(tournament => {
                const players = typeof tournament.players === "string" 
                    ? JSON.parse(tournament.players) 
                    : tournament.players;
                
                players.forEach((player: any) => {
                    if (typeof player === "number") {
                        allPlayerIds.add(player);
                    }
                });
            });
            
            const userMap = new Map<number, string>();
            if (allPlayerIds.size > 0) {
                try {
                    const userResponse: Response = await fetch(`/api/users?ids=${Array.from(allPlayerIds).join(",")}`);
                    if (userResponse.ok) {
                        const users: { id: number; username: string }[] = await userResponse.json();
                        users.forEach(user => {
                            userMap.set(user.id, user.username);
                            usernameToIdMap.set(user.username, user.id);
                        });
                    } else {
                        console.error("Erreur API lors de la récupération des utilisateurs:", await userResponse.text());
                    }
                } catch (error) {
                    console.error("Exception lors de la récupération des noms des joueurs:", error);
                }
            }
            
            tournaments.forEach(tournament => {
                
                const tournamentItem: HTMLDivElement = document.createElement("div");
                tournamentItem.className = "p-3 rounded-lg text-white text-sm flex flex-col bg-gray-900 border border-gray-700 shadow-lg";
    
                const date: string = new Date(tournament.created_at).toLocaleDateString();
    
                const players = typeof tournament.players === "string"
                    ? JSON.parse(tournament.players)
                    : tournament.players;
    
                const ranking = tournament.ranking 
                    ? (typeof tournament.ranking === "string" ? JSON.parse(tournament.ranking) : tournament.ranking)
                    : null;
    
                const playerNames = players.map((player: any) => {
                    if (typeof player === "number") {
                        return userMap.get(player) || "Inconnu";
                    } else {
                        return player;
                    }
                });
    
                let positionText = translatedUnclassified;
                let positionColor = "bg-gray-600";
                
                let tournamentWinner = "?";
                
                if (ranking && Array.isArray(ranking)) {
                    if (ranking.length > 0) {
                        const winnerEntry = String(ranking[0]);
                        tournamentWinner = winnerEntry.replace(/🏆\s*/, '').trim();
                        
                        if (!isNaN(Number(tournamentWinner)) && userMap.has(Number(tournamentWinner)))
                            tournamentWinner = userMap.get(Number(tournamentWinner)) || tournamentWinner;
                    }
                    
                    if (tournamentWinner === profileUsername) {
                        positionText = `🏆 ${translatedWin}`;
                        positionColor = "bg-yellow-500";
                    } else {
                        positionText = `${translatedWin}: ${tournamentWinner}`;
                        positionColor = "bg-gray-700";
                    }
                }
                
                tournamentItem.innerHTML = `
                    <p class="font-bold text-lg text-blue-400">${translatedTournament} n°${tournament.id} ${translatedOf} ${date}</p>
                    <p class="text-sm text-gray-300">Joueurs : ${playerNames.join(", ")}</p>
                    <div class="mt-2 p-2 rounded-lg text-center text-black font-bold ${positionColor}">
                        ${positionText}
                    </div>
                `;
    
                historyContainer.appendChild(tournamentItem);
            });
        } catch (error) {
            historyContainer.innerHTML = `<p class='text-red-500'>${translatedErrorLoadingTournament}</p>`;
        }
    }

    fetchMatchHistory();

    tabsContainer.append(tabMatches, tabTournaments);
    container.append(title, tabsContainer, historyContainer);

    return container;
}
