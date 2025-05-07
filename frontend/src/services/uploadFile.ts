import API_CONFIG from "../config/apiConfig";

export async function uploadFile(formData: FormData) {
    try {
        const response: Response = await fetch(`${API_CONFIG.API_BASE_URL}/uploadFile`, {
            method: "POST",
            body: formData,
        });
        if (!response.ok)
            throw new Error(`Erreur HTTP : ${response.status}`);
        const data = await response.json();
        return data;
    } catch (error) {
        return false;
    }
}