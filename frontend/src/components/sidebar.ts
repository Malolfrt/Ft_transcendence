import { state } from "../state";
import { logout, connectToWebSocket } from "../services/auth";
import { getUsers } from "../services/userService";
import { getFriends, getFriendRequests, removeFriend, acceptFriendRequest, rejectFriendRequest, addFriend } from "../services/friendService";
import { translateText } from "../translate";
import { updateLanguage } from "../services/userService";
import { navigateTo } from "../router";
import API_CONFIG from "../config/apiConfig";

export default async function Sidebar(): Promise<HTMLElement> {
    const existingSidebar = document.querySelector(".sidebar-component");
    if (existingSidebar) {
        return existingSidebar as HTMLElement;
    }

    const textToTranslate: string[] = [
        "invité",
        "Amis",
        "Déconnexion",
        "Gestion des Amis",
        "Demande envoyée",
        "Erreur",
        "Aucun utilisateur trouvé",
        "Demandes d'amitié",
        "Mes Amis",
        "Aucune demande en attente",
        "Aucun ami pour le moment",
        "Voulez-vous vraiment supprimer cet ami ?",
        "Rechercher un utilisateur..."
    ];
    const [
        translatedGuest,
        translatedFriends,
        translatedDeconnexion,
        translatedManageFriends,
        translatedSendFriends,
        translatedError,
        translatedNoUserFound,
        translatedFriendsRequest,
        translatedMyFriends,
        translatedNoRequestinWait,
        translatedNoFriendsForNow,
        translatedNoConfirmDeleteFriend,
        translatedSearchUser
    ] = await Promise.all(textToTranslate.map(text => translateText(text)));

    const sidebar: HTMLElement = document.createElement("aside");
    sidebar.className = "sidebar-component fixed inset-y-0 left-0 w-64 bg-gray-900 text-white flex flex-col shadow-lg z-20 overflow-hidden";

    const mainContainer: HTMLDivElement = document.createElement("div");
    mainContainer.className = "flex w-[calc(200%)] h-full transition-transform duration-300";

    const sidebarContent: HTMLDivElement = document.createElement("div");
    sidebarContent.className = "w-64 flex-shrink-0 flex flex-col h-full";

    const friendsContent: HTMLDivElement = document.createElement("div");
    friendsContent.className = "w-64 flex-shrink-0 flex flex-col h-full bg-gray-900";

    const userContainer: HTMLDivElement = document.createElement("div");
    userContainer.className = "flex flex-col items-center p-6 border-b border-gray-700/50 bg-gray-800/30";

    const avatarContainer: HTMLDivElement = document.createElement("div");
    avatarContainer.className = "relative p-1 rounded-full bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500";
    
    const avatar: HTMLImageElement = document.createElement("img");
    avatar.src = `${API_CONFIG.API_BASE_URL}/images/${state.user?.avatar || 'default.jpg'}`;
    avatar.className = "w-16 h-16 rounded-full border-2 border-gray-900";
    avatarContainer.appendChild(avatar);

    const username: HTMLSpanElement = document.createElement("span");
    username.innerHTML = `${state.user?.username || translatedGuest}`;
    username.className = "text-lg font-semibold mt-3 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent";

    const statusContainer: HTMLDivElement = document.createElement("div");
    statusContainer.className = "flex items-center mt-2";

    const statusIndicator: HTMLSpanElement = document.createElement("span");
    statusIndicator.className = "w-2 h-2 rounded-full mr-2";

    const statusText: HTMLSpanElement = document.createElement("span");
    statusText.className = "text-sm text-gray-400";

    async function updateStatus() {
        try {
            const users = await getUsers();
            const currentUser = users.find(user => user.id === state.user?.id);
            
            if (currentUser) {
                statusIndicator.className = `w-2 h-2 rounded-full mr-2 ${currentUser.status === "online" ? "bg-green-500" : "bg-red-500"}`;
                statusText.innerHTML = currentUser.status === "online" ?  (localStorage.getItem("language") == "fr" ? "En ligne" :  await translateText("online")) : (localStorage.getItem("language") == "fr" ? "Hors ligne" :  await translateText("offline"));
            }
        } catch (error) {
            console.error("Error updating status:", error);
        }
    }

    updateStatus();
    const statusInterval = setInterval(updateStatus, 5000);
    
    sidebar.addEventListener("remove", () => {
        clearInterval(statusInterval);
    });
    statusContainer.append(statusIndicator, statusText);
    userContainer.append(avatarContainer, username, statusContainer);

    const nav: HTMLElement = document.createElement("nav");
    nav.className = "flex flex-col mt-4 px-4 space-y-2";

    const navLinks = [
        { icon: "🏠", text: "Tableau de bord", href: "/dashboard" },
        { icon: "🎮", text: "Matches", href: "/matches" },
        { icon: "📜", text: "Règles", href: "/rules" }
    ];

    navLinks.forEach(link => {
        const a: HTMLAnchorElement = document.createElement("a");
        a.href = link.href;
        a.className = "flex items-center p-3 hover:bg-gray-800/50 rounded-lg transition duration-200 group";

        const icon: HTMLSpanElement = document.createElement("span");
        icon.innerHTML = link.icon;
        icon.className = "mr-3 text-lg group-hover:scale-110 transition-transform";

        const text: HTMLSpanElement = document.createElement("span");
        translateText(link.text).then((translated) => {
            text.innerHTML = translated;
        })
        text.className = "text-gray-300 group-hover:text-white transition-colors";

        a.append(icon, text);
        nav.appendChild(a);
    });

    const friendsButton: HTMLButtonElement = document.createElement("button");
    friendsButton.className = "flex items-center p-3 hover:bg-gray-800/50 rounded-lg transition duration-200 group w-full mt-2";
    friendsButton.innerHTML = '<span class="mr-3 text-lg group-hover:scale-110 transition-transform">👥</span>' + `<span class="text-gray-300 group-hover:text-white transition-colors">${translatedFriends}</span>`;
    friendsButton.onclick = () => {
        mainContainer.style.transform = "translateX(-256px)";
        loadUsers();
        loadFriendRequests();
        loadFriends();
    };
    nav.appendChild(friendsButton);

    const logoutButton: HTMLButtonElement = document.createElement("button");
    logoutButton.className = "mx-4 mb-6 p-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 flex items-center justify-center rounded-lg transition duration-200 group border border-red-500/20";
    logoutButton.innerHTML = '<span class="mr-2 group-hover:scale-110 transition-transform">🔒 </span>' +  translatedDeconnexion;
    logoutButton.onclick = async () => {
        const sidebarContainer = document.querySelector(".sidebar-component");
        if (sidebarContainer) {
            sidebarContainer.remove();
        }
        
        await logout();
    };

    const friendsHeader: HTMLDivElement = document.createElement("div");
    friendsHeader.className = "p-6 border-b border-gray-700/50 bg-gray-800/30 flex items-center";
    
    const backButton: HTMLButtonElement = document.createElement("button");
    backButton.className = "mr-3 text-gray-400 hover:text-white transition-colors";
    backButton.innerHTML = "◀";
    backButton.onclick = () => {
        mainContainer.style.transform = "translateX(0)";
    };

    const friendsTitle: HTMLHeadingElement = document.createElement("h2");
    friendsTitle.className = "text-lg font-semibold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent";
    friendsTitle.innerHTML = translatedManageFriends;

    const refreshButton: HTMLButtonElement = document.createElement("button");
    refreshButton.innerHTML = "🔄";
    refreshButton.className = "ml-2 p-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors";
    refreshButton.title = "Refresh list";
    refreshButton.onclick = () => {
        loadUsers();
        loadFriendRequests();
        loadFriends();
        refreshButton.classList.add("animate-spin");
        setTimeout(() => refreshButton.classList.remove("animate-spin"), 1000);
    };

    friendsHeader.append(backButton, friendsTitle, refreshButton);
    friendsContent.appendChild(friendsHeader);

    const friendsManager: HTMLDivElement = document.createElement("div");
    friendsManager.className = "p-4 space-y-6 overflow-y-auto custom-scrollbar h-[calc(100vh-64px)]";

    const searchSection: HTMLDivElement = document.createElement("div");
    searchSection.className = "bg-gray-800/50 p-4 rounded-lg border border-purple-500/20";

    const notificationDiv: HTMLDivElement = document.createElement("div");
    notificationDiv.className = "mb-4";

    const searchForm: HTMLFormElement = document.createElement("form");
    searchForm.className = "flex flex-col gap-2";

    function showNotification(message: string, isSuccess: boolean = true) {
        const notification = document.createElement("div");
        notification.className = `p-3 rounded-lg mb-2 flex items-center justify-between ${
            isSuccess ? "bg-green-900/50 border border-green-500/30" : "bg-red-900/50 border border-red-500/30"
        }`;
        
        const messageSpan = document.createElement("span");
        messageSpan.className = "text-sm";
        messageSpan.innerHTML = message;
        
        const closeBtn = document.createElement("button");
        closeBtn.innerHTML = "✕";
        closeBtn.className = "text-gray-400 hover:text-white";
        closeBtn.onclick = () => notification.remove();
        
        notification.append(messageSpan, closeBtn);
        notificationDiv.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = "0";
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    const searchInput: HTMLInputElement = document.createElement("input");
    searchInput.type = "text";
    searchInput.placeholder = translatedSearchUser;
    searchInput.className = "flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg border border-purple-500/30 focus:outline-none focus:border-purple-500 transition-colors";

    const searchResults: HTMLDivElement = document.createElement("div");
    searchResults.className = "hidden flex-col gap-1 mt-2 max-h-32 overflow-y-auto custom-scrollbar";

    searchInput.oninput = async () => {
        const searchTerm: string = searchInput.value.trim().toLowerCase();
        if (searchTerm.length < 2) {
            searchResults.innerHTML = "";
            searchResults.className = "hidden flex-col gap-1 mt-2";
            return;
        }

        const filteredUsers = users.filter(u => 
            u.username.toLowerCase().includes(searchTerm) && 
            u.id !== state.user.id
        );

        searchResults.innerHTML = "";
        if (filteredUsers.length > 0) {
            searchResults.className = "flex flex-col gap-1 mt-2 max-h-32 overflow-y-auto custom-scrollbar";
            filteredUsers.forEach(user => {
                const userItem: HTMLButtonElement = document.createElement("button");
                userItem.type = "button";
                userItem.className = "flex items-center gap-2 p-2 hover:bg-gray-700/50 rounded-lg transition-colors";
                userItem.innerHTML = `
                    <img src="${API_CONFIG.API_BASE_URL}/images/${user.avatar}" class="w-6 h-6 rounded-full border border-purple-500/30">
                    <span class="text-sm">${user.username}</span>
                `;
                userItem.onclick = async () => {
                    try {
                        await addFriend(user.id);
                        searchInput.value = "";
                        searchResults.className = "hidden flex-col gap-1 mt-2";
                        loadFriendRequests();
                        showNotification("Friend request sent successfully!");
                    } catch (error) {
                        showNotification("Error sending friend request", false);
                    }
                };
                searchResults.appendChild(userItem);
            });
        } else {
            searchResults.className = "flex flex-col gap-1 mt-2";
            searchResults.innerHTML = `<div class="text-gray-400 text-sm text-center py-1">${translatedNoUserFound}</div>`;
        }
    };

    searchForm.onsubmit = (e) => e.preventDefault();
    searchForm.append(searchInput, searchResults);
    searchSection.appendChild(notificationDiv);
    searchSection.appendChild(searchForm);

    const requestsSection: HTMLDivElement = document.createElement("div");
    requestsSection.className = "bg-gray-800/50 p-4 rounded-lg border border-yellow-500/20";

    const requestsTitle: HTMLHeadingElement = document.createElement("h3");
    requestsTitle.className = "text-yellow-300 font-semibold mb-3 flex items-center gap-2";
    requestsTitle.innerHTML = "📨 " + translatedFriendsRequest;

    const requestsList: HTMLUListElement = document.createElement("ul");
    requestsList.className = "space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar";

    requestsSection.append(requestsTitle, requestsList);

    const friendsList: HTMLDivElement = document.createElement("div");
    friendsList.className = "bg-gray-800/50 p-4 rounded-lg border border-green-500/20";

    const confirmationDialog: HTMLDivElement = document.createElement("div");
    confirmationDialog.className = "fixed inset-0 bg-black/50 flex items-center justify-center z-50 hidden";
    
    const dialogContent: HTMLDivElement = document.createElement("div");
    dialogContent.className = "bg-gray-800 p-6 rounded-lg border border-red-500/30 max-w-md w-full";
    
    const dialogTitle: HTMLHeadingElement = document.createElement("h3");
    dialogTitle.className = "text-lg font-semibold text-red-400 mb-4";
    dialogTitle.innerHTML = "Confirm deletion";
    
    const dialogMessage: HTMLParagraphElement = document.createElement("p");
    dialogMessage.className = "text-gray-300 mb-6";
    
    const dialogButtons: HTMLDivElement = document.createElement("div");
    dialogButtons.className = "flex justify-end gap-3";
    
    const cancelButton: HTMLButtonElement = document.createElement("button");
    cancelButton.className = "px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors";
    cancelButton.innerHTML = "Cancel";
    
    const confirmButton: HTMLButtonElement = document.createElement("button");
    confirmButton.className = "px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg transition-colors";
    confirmButton.innerHTML = "Delete";
    
    dialogButtons.append(cancelButton, confirmButton);
    dialogContent.append(dialogTitle, dialogMessage, dialogButtons);
    confirmationDialog.appendChild(dialogContent);
    document.body.appendChild(confirmationDialog);

    const friendsListTitle: HTMLHeadingElement = document.createElement("h3");
    friendsListTitle.className = "text-green-300 font-semibold mb-3 flex items-center gap-2";
    friendsListTitle.innerHTML = "👥 " + translatedMyFriends;

    const friendsUl: HTMLUListElement = document.createElement("ul");
    friendsUl.className = "space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar";

    friendsList.append(friendsListTitle, friendsUl);

    friendsManager.append(searchSection, requestsSection, friendsList);
    friendsContent.appendChild(friendsManager);

    let users: any[] = [];

    async function loadUsers() {
        users = await getUsers();
    }

    async function loadFriendRequests() {
        const requests = await getFriendRequests();
        requestsList.innerHTML = "";

        if (requests.length === 0) {
            requestsList.innerHTML = `<li class="text-gray-400 text-center py-2">${translatedNoRequestinWait}</li>`;
            return;
        }

        requests.forEach((request: any) => {
            const li: HTMLLIElement = document.createElement("li");
            li.className = "flex items-center justify-between p-2 bg-gray-700/50 rounded-lg";

            const userInfo: HTMLDivElement = document.createElement("div");
            userInfo.className = "flex items-center gap-2";

            const avatar: HTMLImageElement = document.createElement("img");
            avatar.src = `${API_CONFIG.API_BASE_URL}/images/${request.avatar}`;
            avatar.className = "w-8 h-8 rounded-full border border-yellow-500/30";

            const username: HTMLSpanElement = document.createElement("span");
            username.innerHTML = request.username;
            username.className = "text-sm";

            userInfo.append(avatar, username);

            const buttons: HTMLDivElement = document.createElement("div");
            buttons.className = "flex gap-1";

            const acceptBtn: HTMLButtonElement = document.createElement("button");
            acceptBtn.innerHTML = "✅";
            acceptBtn.className = "p-1.5 bg-green-600 hover:bg-green-500 rounded-lg transition-colors";
            acceptBtn.onclick = async () => {
                await acceptFriendRequest(request.id);
                loadFriendRequests();
                loadFriends();
            };

            const rejectBtn: HTMLButtonElement = document.createElement("button");
            rejectBtn.innerHTML = "❌";
            rejectBtn.className = "p-1.5 bg-red-600 hover:bg-red-500 rounded-lg transition-colors";
            rejectBtn.onclick = async () => {
                await rejectFriendRequest(request.id);
                loadFriendRequests();
            };

            buttons.append(acceptBtn, rejectBtn);
            li.append(userInfo, buttons);
            requestsList.appendChild(li);
        });
    }

    async function loadFriends() {
        const textToTranslate: string[] = [
            "Voulez-vous vraiment supprimer ",
            "de vos amis ?",
            "a été supprimé de vos amis"
        ];
        const [
            translatedReallyDel,
            translatedYourFriends,
            translatedFriendDel
        ] = await Promise.all(textToTranslate.map(text => translateText(text)));

        const friends = await getFriends();
        friendsUl.innerHTML = "";

        if (friends.length === 0) {
            friendsUl.innerHTML = `<li class="text-gray-400 text-center py-2">${translatedNoFriendsForNow}</li>`;
            return;
        }

        friends.sort((a: any, b: any) => (a.status === "online" ? -1 : 1));

        friends.forEach(async (friend: any) => {
            const li: HTMLLIElement = document.createElement("li");
            li.id = `friend-${friend.id}`;
            li.className = `flex items-center justify-between p-2 ${friend.status === "online" ? "bg-green-900/30" : "bg-gray-700/50"} rounded-lg group`;

            const userInfo: HTMLDivElement = document.createElement("div");
            userInfo.className = "flex items-center gap-2";

            const avatar: HTMLImageElement = document.createElement("img");
            avatar.src = `${API_CONFIG.API_BASE_URL}/images/${friend.avatar}`;
            avatar.className = "w-8 h-8 rounded-full border border-green-500/30";

            const username: HTMLDivElement = document.createElement("div");
            username.className = "flex flex-col";
            
            username.innerHTML = `
                <span class="text-sm">${friend.username}</span>
                <span class="text-xs ${friend.status === "online" ? "text-green-400" : "text-gray-400"}">
                    ${friend.status === "online" ? (localStorage.getItem("language") == "fr" ? "En ligne" :  await translateText("online")) : (localStorage.getItem("language") == "fr" ? "Hors ligne" :  await translateText("offline"))}
                </span>
            `;

            userInfo.append(avatar, username);

            const buttonsContainer: HTMLDivElement = document.createElement("div");
            buttonsContainer.className = "flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity";

            const viewProfileBtn: HTMLButtonElement = document.createElement("button");
            viewProfileBtn.innerHTML = "👤";
            viewProfileBtn.className = "p-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors";
            viewProfileBtn.onclick = (event) => {
                event.preventDefault();
                const profileUrl = `/profile/${friend.id}`;
                window.history.pushState({}, "", profileUrl);
                window.dispatchEvent(new Event("popstate"));
            };

            const removeBtn: HTMLButtonElement = document.createElement("button");
            removeBtn.innerHTML = "🗑️";
            removeBtn.className = "p-1.5 bg-red-600 hover:bg-red-500 rounded-lg transition-all scale-95 group-hover:scale-100";
            removeBtn.onclick = async () => {
                dialogMessage.innerHTML = `${translatedReallyDel} ${friend.username} ${translatedYourFriends}`;
                confirmationDialog.classList.remove("hidden");

                const handleConfirm = async () => {
                    await removeFriend(friend.id);
                    loadFriends();
                    confirmationDialog.classList.add("hidden");
                    showNotification(`${friend.username} ${translatedFriendDel}`);
                };
                
                const handleCancel = () => {
                    confirmationDialog.classList.add("hidden");
                };
                
                confirmButton.onclick = handleConfirm;
                cancelButton.onclick = handleCancel;
                
                const cleanup = () => {
                    confirmButton.onclick = null;
                    cancelButton.onclick = null;
                    confirmationDialog.removeEventListener("click", handleOutsideClick);
                };
                
                const handleOutsideClick = (e: MouseEvent) => {
                    if (e.target === confirmationDialog) {
                        handleCancel();
                        cleanup();
                    }
                };
                
                confirmationDialog.addEventListener("click", handleOutsideClick);
            };

            buttonsContainer.append(viewProfileBtn, removeBtn);
            li.append(userInfo, buttonsContainer);
            friendsUl.appendChild(li);
        });
    }

    connectToWebSocket(String(state.user.id), async (message) => {
        if (message.type === "user_status") {
            
            if (message.userId === state.user.id) {
                statusIndicator.className = `w-2 h-2 rounded-full mr-2 ${message.status === "online" ? "bg-green-500" : "bg-red-500"}`;
                statusText.innerHTML = message.status === "online" ? 
                    (localStorage.getItem("language") == "fr" ? "En ligne" : await translateText("online")) : 
                    (localStorage.getItem("language") == "fr" ? "Hors ligne" : await translateText("offline"));
            }
            
            const friendElement = document.getElementById(`friend-${message.userId}`);
            if (friendElement) {
                friendElement.className = `flex items-center justify-between p-2 ${message.status === "online" ? "bg-green-900/30" : "bg-gray-700/50"} rounded-lg group`;
                const statusSpan = friendElement.querySelector(".text-xs");
                if (statusSpan) {
                    statusSpan.className = `text-xs ${message.status === "online" ? "text-green-400" : "text-gray-400"}`;
                    statusSpan.innerHTML = message.status === "online" ? 
                        (localStorage.getItem("language") == "fr" ? "🟢 En ligne" : "🟢 " + await translateText("online")) : 
                        (localStorage.getItem("language") == "fr" ? "⭘ Hors ligne" : "⭘ " + await translateText("offline"));
                }
            }
            
            updateStatus();
        }
    });

    const languageDiv: HTMLDivElement = document.createElement("div");
    languageDiv.className = "mt-auto mb-4 flex p-3 flex-row flex-wrap justify-around items-center";
    
    const btnEN: HTMLButtonElement = document.createElement("button");
    const btnES: HTMLButtonElement = document.createElement("button");
    const btnFR: HTMLButtonElement = document.createElement("button");
    btnEN.innerHTML = "🇺🇸";
    btnEN.className = "px-1 m-1 border-2 border-red-500/75 rounded hover:bg-red-700 duration-500";
    
    btnES.innerHTML = "🇪🇦";
    btnES.className = "px-1 m-1 border-2 border-yellow-500/75 rounded hover:bg-yellow-700 duration-500";
    
    btnFR.innerHTML = "🇨🇵";
    btnFR.className = "px-1 m-1 border-2 border-blue-500/75 rounded hover:bg-blue-700 duration-500";
    languageDiv.appendChild(btnEN);
    languageDiv.appendChild(btnES);
    languageDiv.appendChild(btnFR);

    btnEN.onclick = async () => {
        const langue: string = "en";
        localStorage.setItem("language", langue);
        updateLanguage(state.user.id, langue);
        window.location.reload();
    };
    btnES.onclick = async () => {
        const langue: string = "es";
        localStorage.setItem("language", langue);
        updateLanguage(state.user.id, langue);
        window.location.reload();
    };
    btnFR.onclick = async () => {
        const langue: string = "fr";
        localStorage.setItem("language", langue);
        updateLanguage(state.user.id, langue);
        window.location.reload();
    };

    if (localStorage.getItem("language") == "en")
        btnEN.classList.add("bg-red-700");
    else if (localStorage.getItem("language") == "es")
        btnES.classList.add("bg-yellow-700");
    else
        btnFR.classList.add("bg-blue-700");

    sidebarContent.append(userContainer, nav, languageDiv, logoutButton);
    mainContainer.append(sidebarContent, friendsContent);
    sidebar.appendChild(mainContainer);
    return sidebar;
}