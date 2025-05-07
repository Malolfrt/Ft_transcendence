import MatchHistory from "./MatchHistory";
import Leaderboard from "./Leaderboard";
import StarsBackground from "./StarsBackground";
import ProfileStats from "./ProfileStats";
import Sidebar from "../../components/sidebar";
import { getFriendDetails } from "../../services/friendService";
import BackButton from "./BackButton";
import { translateText } from "../../translate";
import API_CONFIG from "../../config/apiConfig";

export default async function UserProfile(userId: number): Promise<HTMLElement> {
    
    const textsToTranslate: string[] = [
        "Chargement...",
        "Profil non disponible",
        "Statut inconnu"
    ];
    
    const [
        translatedLoading,
        translatedProfileNotFound,
        translatedUnknownStatus
    ] = await Promise.all(textsToTranslate.map(text => translateText(text)));

    document.body.classList.add("overflow-hidden");
    const mainContainer: HTMLDivElement = document.createElement("div");
    mainContainer.className = "flex w-full h-screen overflow-hidden bg-gray-900";
    
    const sidebar: Promise<HTMLElement> = Sidebar();
    mainContainer.appendChild(await sidebar);
    
    const profileWrapper: HTMLDivElement = document.createElement("div");
    profileWrapper.className = "relative flex-1 h-screen flex flex-col ml-0 md:ml-64";

    profileWrapper.appendChild(StarsBackground());
    
    const layoutWrapper: HTMLDivElement = document.createElement("div");
    layoutWrapper.className = "grid grid-cols-1 lg:grid-cols-12 gap-6 w-full h-screen p-6 md:pl-10 overflow-y-auto";

    const backButtonContainer: HTMLDivElement = document.createElement("div");
    backButtonContainer.className = "fixed top-4 left-4 z-10";
    backButtonContainer.appendChild(BackButton());
    profileWrapper.appendChild(backButtonContainer);

    const topRow: HTMLDivElement = document.createElement("div");
    topRow.className = "lg:col-span-12 grid grid-cols-1 lg:grid-cols-12 gap-6";

    const profileSection: HTMLDivElement = document.createElement("div");
    profileSection.className = "lg:col-span-3 bg-gray-800 rounded-lg shadow-lg flex flex-col items-center p-6";
    
    const avatarCircle: HTMLDivElement = document.createElement("div");
    avatarCircle.className = "w-32 h-32 rounded-full border-2 border-blue-400/50 flex items-center justify-center mb-4";

    const avatar: HTMLImageElement = document.createElement("img");
    avatar.src = `${API_CONFIG.API_BASE_URL}/images/default.jpg`;
    avatar.className = "w-24 h-24 rounded-full";
    avatarCircle.appendChild(avatar);

    const username: HTMLHeadingElement = document.createElement("h2");
    username.className = "text-xl font-bold text-white/90 mb-3";
    username.innerHTML = translatedLoading;

    const status: HTMLDivElement = document.createElement("div");
    status.className = "flex items-center gap-2 text-gray-400";

    const statusIndicator: HTMLSpanElement = document.createElement("span");
    statusIndicator.className = "w-2 h-2 rounded-full bg-gray-500";

    const statusText: HTMLSpanElement = document.createElement("span");
    statusText.className = "text-sm";
    statusText.innerHTML = translatedLoading;

    status.append(statusIndicator, statusText);
    
    profileSection.append(avatarCircle, username, status);

    const leaderboard: HTMLDivElement = document.createElement("div");
    leaderboard.className = "lg:col-span-6 bg-gray-800 rounded-lg shadow-lg flex flex-col";
    Leaderboard().then(container => {
        leaderboard.append(container);
    });
    
    const history: HTMLDivElement = document.createElement("div");
    history.className = "lg:col-span-3 bg-gray-800 rounded-lg shadow-lg flex flex-col";
    MatchHistory(userId).then(container => {
        history.innerHTML = "";
        history.append(container);
    });

    topRow.append(profileSection, leaderboard, history);
    
    const stats: Promise<HTMLElement> = ProfileStats(userId);
    (await stats).className = "lg:col-span-12 bg-gray-800 rounded-lg shadow-lg";

    layoutWrapper.append(topRow, await stats);
    
    const toggleSidebarButton: HTMLDivElement = document.createElement("div");
    toggleSidebarButton.className = "fixed top-4 right-4 w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center cursor-pointer text-white text-base transition duration-300 transform hover:scale-110 hover:bg-gray-600 shadow-lg z-10 md:hidden";
    toggleSidebarButton.innerHTML = `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>`;
    
    toggleSidebarButton.onclick = async () => {
        if ((await sidebar).classList.contains("hidden")) {
            (await sidebar).classList.remove("hidden");
            sidebarOverlay.classList.remove("hidden");
        } else {
            (await sidebar).classList.add("hidden");
            sidebarOverlay.classList.add("hidden");
        }
    };
    
    const sidebarOverlay: HTMLDivElement = document.createElement("div");
    sidebarOverlay.className = "fixed inset-0 bg-black bg-opacity-50 z-20 hidden md:hidden";
    sidebarOverlay.onclick = async () => {
        (await sidebar).classList.add("hidden");
        sidebarOverlay.classList.add("hidden");
    };
    
    (await sidebar).classList.add("hidden", "md:flex");
    
    profileWrapper.append(toggleSidebarButton, sidebarOverlay, layoutWrapper);
    mainContainer.appendChild(profileWrapper);

    async function loadUserInfo() {
        try {
            const friend = await getFriendDetails(userId);
            
            if (!friend)
                throw new Error("Utilisateur non trouvé");
            
            avatar.src = `${API_CONFIG.API_BASE_URL}/images/${friend.avatar || "default.jpg"}`;
            username.innerHTML = friend.username;
            
            statusIndicator.className = `w-2 h-2 rounded-full ${friend.status === "online" ? "bg-green-500" : "bg-red-500"}`;
            statusText.innerHTML = friend.status === "online" 
                ? (localStorage.getItem("language") == "fr" ? "En ligne" : await translateText("online")) 
                : (localStorage.getItem("language") == "fr" ? "Hors ligne" : await translateText("offline"));
            
            if (friend.status === "online") {
                avatarCircle.className = "w-32 h-32 rounded-full border-2 border-green-400/50 flex items-center justify-center mb-4";
            } else {
                avatarCircle.className = "w-32 h-32 rounded-full border-2 border-red-400/50 flex items-center justify-center mb-4";
            }
        } catch (error) {
            username.innerHTML = translatedProfileNotFound;
            statusText.innerHTML = translatedUnknownStatus;
        }
    }

    loadUserInfo();
    return mainContainer;
} 