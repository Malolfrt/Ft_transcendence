import { saveAuthData } from "./auth";
import { state } from "../../src/state";
import API_CONFIG from "../config/apiConfig";

interface User {
    id: number;
    username: string;
    email?: string;
    avatar: string | null;
    status: string;
    wins: number;
    anonymize: number;
    [key: string]: any;
}

let cachedUsers: Map<number, User> = new Map();
let lastFetchTime: number = 0;
const CACHE_DURATION = 5000;

export async function refreshUserCache() {
    lastFetchTime = 0;
    cachedUsers.clear();
    return await getUsers();
}

export async function getUsers(): Promise<User[]> {
    const now = Date.now();
    
    if (cachedUsers.size > 0 && now - lastFetchTime < CACHE_DURATION) {
        return Array.from(cachedUsers.values());
    }

    try {
        const response = await fetch(`${API_CONFIG.API_BASE_URL}/users/all`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            cache: 'no-cache'
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP : ${response.status}`);
        }

        const users: User[] = await response.json();
        
        cachedUsers.clear();
        users.forEach(user => {
            if (user.avatar) {
                user.avatar = user.avatar.startsWith('http') ? user.avatar : `${API_CONFIG.API_BASE_URL}/images/${user.avatar}`;
            } else {
                user.avatar = `${API_CONFIG.API_BASE_URL}/images/default.jpg`;
            }
            user.wins = parseInt(user.wins as any) || 0;
            cachedUsers.set(user.id, user);
        });
        lastFetchTime = now;

        return users;
    } catch (error) {
        if (cachedUsers.size > 0) {
            return Array.from(cachedUsers.values());
        }
        return [];
    }
}

export async function updateUser(token: string | "", username:string, inputUsername: string, inputEmail: string) {
    try {
        const response: Response = await fetch(`${API_CONFIG.API_BASE_URL}/users/username/${username}/update`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ inputUsername, inputEmail }),
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(`Erreur HTTP : ${response.status}`);
        }
        saveAuthData(token, data.user);
        return true;
    } catch (error) {
        return false;
    }
}

export async function updatePhotoUser(username: string, file: string) {
    try {
        const response = await fetch(`${API_CONFIG.API_BASE_URL}/users/username/${username}/updatephoto`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, file }),
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP : ${response.status}`);
        }

        const data = await response.json();
        
        await refreshUserCache();
        
        if (state.user && state.user.username === username) {
            state.user = {
                ...state.user,
                avatar: file
            };
            localStorage.setItem("user", JSON.stringify(state.user));
        }

        return true;
    } catch (error) {
        return false;
    }
}

export async function deleteUser(username: string) {
    try {
        const response: Response = await fetch(`${API_CONFIG.API_BASE_URL}/users/username/${username}`, {
            method: "DELETE",
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP : ${response.status}`);
        }
        return true;
    } catch (error) {
        return false;
    }
}


export async function anonymizeUser(username: string, token: string | "") {

    try {
        const response: Response = await fetch(`${API_CONFIG.API_BASE_URL}/users/username/${username}/anonymize`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Erreur de connexion");
        
        saveAuthData(token, data.user);

        if (!response.ok) {
            throw new Error(`Erreur HTTP : ${response.status}`);
        }
        return true;
    } catch (error) {
        return false;
    }
}

export async function getAllUsers() {
    const response: Response = await fetch(`${API_CONFIG.API_BASE_URL}/users`);
    return response.json();
}

export async function authenticateUser(username: string, password: string) {
    const response: Response = await fetch(`${API_CONFIG.API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    });

    return response.ok;
}

export async function getQrcode(userId : number, username : string)
{
    return fetch(`${API_CONFIG.API_BASE_URL}/2FA/generate-2fa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({userId, username})
    })
    .then(response => response.json())
    .then(data => data.qrCode)
    .catch(error => console.error("Erreur lors de la récupération du QR Code:", error));    
}


export async function update2FAOff(userId : number, username : string)
{
    return fetch(`${API_CONFIG.API_BASE_URL}/2FA/disable-2fa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({userId, username})
    })
    .then(response => response.json())
    .catch(error => console.error("Erreur lors de la désacivation du 2FA:", error));   
}

export async function getUserById(userId: number): Promise<User | null> {
    if (cachedUsers.has(userId)) {
        const cachedUser = cachedUsers.get(userId);
        const cacheAge = Date.now() - lastFetchTime;
        
        if (cacheAge < CACHE_DURATION) {
            return cachedUser || null;
        }
    }

    const users = await getUsers();
    const user = users.find(u => u.id === userId);
    return user || null;
}

export async function updateLanguage(userId : number, language : string)
{
    return fetch(`${API_CONFIG.API_BASE_URL}/users/language`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({userId, language})
    })
    .then(response => response.json())
    .catch(error => console.error("Erreur lors de la mise à jour de la langue:", error));
}

