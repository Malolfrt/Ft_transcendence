export async function translateText(text: string): Promise<string> 
{
    const target: string | null = localStorage.getItem("language");
    if (target == "fr" || !target)
        return text;

    const cacheKey: string = `translation_${target}_${text}`;
    const cachedTranslation: string | null = localStorage.getItem(cacheKey);
    if (cachedTranslation) {
        return cachedTranslation;
    }

    const source: string = "fr";
    const url: string = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${source}|${target}`;
    try {
        const response: Response = await fetch(url);
        const data = await response.json();
        const translatedText = data.responseData.translatedText || "Erreur de traduction";
        localStorage.setItem(cacheKey, translatedText);
        return translatedText;
    } catch (error) {
        return "Erreur de traduction";
    }
}