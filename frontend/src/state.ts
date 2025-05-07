export const state = {
    user: JSON.parse(localStorage.getItem("user") || "null"),
    token: localStorage.getItem("token") || null,
    socket: null as WebSocket | null,

    localMatch: null as {
        player1: string;
        player2: string;
        player2Auth: null;
        mode: "points";
        target: number;
    } | null,

    aiGame: null as {
        level: string;
        mode?: "points";
        target?: number;
    } | null,
    
    aiMatch: null as {
        player: string;
        level: string;
        mode: "points";
        target: number;
        scoreHuman: number;
        scoreAI: number;
    } | null,

    tournament: null as {
        players: string[];
        matchs: number;
        mode: "points";
        target: number;
        bracket: { 
            round: number; 
            matchups: { 
                player1: string; 
                player2: string | null; 
                winner?: string;
            }[] 
        }[];

        currentMatch?: { 
            player1: string; 
            player2: string | null; 
            winner?: string;
        }; 

        lastWinner?: string;
        winner?: string;
    } | null,
};
