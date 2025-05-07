import { state } from "../../state";
import { translateText } from "../../translate";
import { getUsers, refreshUserCache } from "../../services/userService";
import API_CONFIG from "../../config/apiConfig";

let translatedWin: string = "Victoires";
let translatedError: string = "Erreur lors du chargement du classement";

export default async function Leaderboard(): Promise<HTMLElement> {
    [translatedWin, translatedError] = await Promise.all([
        translateText("Victoires"),
        translateText("Erreur lors du chargement du classement")
    ]);

    const container: HTMLDivElement = document.createElement("div");
    container.className = "bg-gray-800 text-white rounded-xl shadow-lg p-6 flex flex-col items-center w-full h-full";

    const title: HTMLHeadingElement = document.createElement("h2");
    title.className = "text-2xl font-bold mb-8 text-center";

    const podiumContainer: HTMLDivElement = document.createElement("div");
    podiumContainer.className = "relative flex justify-center items-end mb-10 w-full h-64";

    const leadersContainer: HTMLDivElement = document.createElement("div");
    leadersContainer.className = "w-full max-w-lg mb-4";

    async function fetchLeaderboard() {
        try {
            podiumContainer.innerHTML = '';
            leadersContainer.innerHTML = '';

            const users = await getUsers();
            
            const leaderboardData = users
                .sort((a, b) => b.wins - a.wins)
                .slice(0, 6);

            if (leaderboardData.length >= 3) {
                const podiumSteps = document.createElement("div");
                podiumSteps.className = "absolute bottom-0 left-0 right-0 flex justify-center items-end h-32";
                
                const step1 = document.createElement("div");
                step1.className = "w-32 h-32 bg-yellow-500/20 rounded-t-lg mx-2";
                
                const step2 = document.createElement("div");
                step2.className = "w-32 h-24 bg-gray-400/20 rounded-t-lg mx-2";
                
                const step3 = document.createElement("div");
                step3.className = "w-32 h-20 bg-orange-500/20 rounded-t-lg mx-2";
                
                podiumSteps.append(step2, step1, step3);

                const winner = leaderboardData[0];
                const winnerElement = createPodiumPlayer(winner, 1, "absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2", "120px");
                
                const second = leaderboardData[1];
                const secondElement = createPodiumPlayer(second, 2, "absolute left-1/4 transform -translate-x-1/2 translate-y-4", "100px");
                
                const third = leaderboardData[2];
                const thirdElement = createPodiumPlayer(third, 3, "absolute right-1/4 transform translate-x-1/2 translate-y-8", "90px");
                
                podiumContainer.append(podiumSteps, winnerElement, secondElement, thirdElement);
            }

            leaderboardData.slice(3, 6).forEach((player, index) => {
                const rank = index + 4;
                const listItem = document.createElement("div");
                listItem.className = "flex items-center justify-between py-3 px-4 bg-gray-700/50 rounded-lg mb-2 hover:bg-gray-700 transition-colors";
                
                const leftSection = document.createElement("div");
                leftSection.className = "flex items-center gap-3";
                
                const rankElement = document.createElement("span");
                rankElement.innerText = `#${rank}`;
                rankElement.className = "text-gray-400 font-medium";
                
                const playerAvatar = document.createElement("img");
                playerAvatar.src = player.avatar || `${API_CONFIG.API_BASE_URL}/images/default.jpg`;
                playerAvatar.className = "w-8 h-8 rounded-full border border-gray-600 object-cover";
                playerAvatar.onerror = () => {
                    playerAvatar.src = `${API_CONFIG.API_BASE_URL}/images/default.jpg`;
                };
                
                const username = document.createElement("span");
                username.innerText = player.username;
                username.className = "text-white";
                
                leftSection.append(rankElement, playerAvatar, username);
                
                const wins = document.createElement("span");
                wins.innerText = `${player.wins} ${translatedWin}`;
                wins.className = "text-green-400 font-medium";
                
                listItem.append(leftSection, wins);
                leadersContainer.appendChild(listItem);
            });
        } catch (error) {
            podiumContainer.innerHTML = `<p class='text-red-500'>${translatedError}</p>`;
        }
    }

    function createPodiumPlayer(player: any, position: number, positionClass: string, size: string): HTMLDivElement {
        const playerElement = document.createElement("div");
        playerElement.className = `flex flex-col items-center ${positionClass}`;
        
        const avatarContainer = document.createElement("div");
        avatarContainer.className = `relative rounded-full border-4 
            ${position === 1 ? 'border-yellow-500' : position === 2 ? 'border-gray-400' : 'border-orange-500'}
            ${position === 1 ? 'bg-yellow-500/10' : position === 2 ? 'bg-gray-400/10' : 'bg-orange-500/10'}
            flex items-center justify-center`;
        avatarContainer.style.width = size;
        avatarContainer.style.height = size;
        
        const rankBadge = document.createElement("div");
        rankBadge.className = `absolute -top-2 -right-2 z-10 
            ${position === 1 ? 'bg-yellow-500' : position === 2 ? 'bg-gray-400' : 'bg-orange-500'} 
            rounded-full w-8 h-8 flex items-center justify-center text-gray-900 font-bold text-sm
            border-2 border-gray-800`;
        rankBadge.innerText = `#${position}`;
        
        const avatar = document.createElement("img");
        avatar.src = player.avatar || `${API_CONFIG.API_BASE_URL}/images/default.jpg`;
        avatar.className = "rounded-full object-cover";
        avatar.style.width = `calc(${size} - 16px)`;
        avatar.style.height = `calc(${size} - 16px)`;
        avatar.onerror = () => {
            avatar.src = `${API_CONFIG.API_BASE_URL}/images/default.jpg`;
        };
        
        avatarContainer.append(avatar, rankBadge);
        
        const username = document.createElement("span");
        username.innerText = player.username;
        username.className = "text-white font-semibold mt-2 text-center";
        
        const winsCount = document.createElement("span");
        winsCount.innerText = `${player.wins} ${translatedWin}`;
        winsCount.className = "text-green-400 text-sm";
        
        playerElement.append(avatarContainer, username, winsCount);
        return playerElement;
    }

    const refreshInterval = setInterval(async () => {
        await refreshUserCache();
        await fetchLeaderboard();
    }, 10000);

    window.addEventListener('beforeunload', () => {
        clearInterval(refreshInterval);
    });

    await fetchLeaderboard();

    container.append(title, podiumContainer, leadersContainer);
    return container;
}
