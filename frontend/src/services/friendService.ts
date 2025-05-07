import { state } from "../state";
import { getUsers } from "./userService";
import API_CONFIG from "../config/apiConfig";

export async function getFriends() {
    try {
        const response: Response = await fetch(`${API_CONFIG.API_BASE_URL}/users/${state.user.id}/friends`);
        if (!response.ok) throw new Error("Erreur lors de la récupération des amis");
        return await response.json();
    } catch (error) {
        return [];
    }
}

export async function getFriendRequests() {
    try {
        const response: Response = await fetch(`${API_CONFIG.API_BASE_URL}/users/${state.user.id}/friend-requests`);
        if (!response.ok) throw new Error("Erreur lors de la récupération des demandes d'amitié");
        return await response.json();
    } catch (error) {
        return [];
    }
}

export async function getFriendDetails(friendId: number) {
    try {
        const friends = await getFriends();
        const friend = friends.find((f: any) => f.id === friendId);
        
        if (friend) {
            return friend;
        }
        
        const users = await getUsers();
        const user = users.find((u: any) => u.id === friendId);
        
        if (user) {
            return user;
        }
        
        throw new Error("Ami non trouvé");
    } catch (error) {
        return null;
    }
}

export async function addFriend(friendId: number) {
    try {
        const response: Response = await fetch(`${API_CONFIG.API_BASE_URL}/users/${state.user.id}/friends/${friendId}`, {
            method: "POST"
        });
        if (!response.ok) throw new Error("Erreur lors de l'envoi de la demande d'amitié");
        return await response.json();
    } catch (error) {
        return null;
    }
}

export async function removeFriend(friendId: number) {
    try {
        const response: Response = await fetch(`${API_CONFIG.API_BASE_URL}/users/${state.user.id}/friends/${friendId}`, {
            method: "DELETE"
        });
        if (!response.ok) throw new Error("Erreur lors de la suppression de l'ami");
        return await response.json();
    } catch (error) {
        return null;
    }
}

export async function acceptFriendRequest(friendId: number) {
    try {
        const response: Response = await fetch(`${API_CONFIG.API_BASE_URL}/users/${state.user.id}/friends/${friendId}/accept`, {
            method: "PATCH"
        });
        if (!response.ok) throw new Error("Erreur lors de l'acceptation de la demande d'amitié");
        return await response.json();
    } catch (error) {
        return null;
    }
}

export async function rejectFriendRequest(friendId: number) {
    try {
        const response: Response = await fetch(`${API_CONFIG.API_BASE_URL}/users/${state.user.id}/friends/${friendId}/reject`, {
            method: "PATCH"
        });
        if (!response.ok) throw new Error("Erreur lors du rejet de la demande d'amitié");
        return await response.json();
    } catch (error) {
        return null;
    }
} 