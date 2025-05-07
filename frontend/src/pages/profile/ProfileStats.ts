import Chart from "chart.js/auto";
import { state } from "../../state";
import { translateText } from "../../translate";

export default async function ProfileStats(userId?: number): Promise<HTMLElement> {

    /*          TRANSLATE TAB          */
    const textToTranslate: string[] = [
        "Statistique",
        "Utilisateur introuvable.",
        "Aucune statistique disponible.",
        "Total des jeux :",
        "Victoires :",
        "Pertes :",
        "Taux de victoire :",
    ];
    const [
        translatedStats,
        translatedUserNotFound,
        translatedStatsNotFound,
        translatedTotalGames,
        translatedWins,
        translatedLosses,
        translatedWinRates
    ] = await Promise.all(textToTranslate.map(text => translateText(text)));

    const container: HTMLDivElement = document.createElement("div");
    container.className = "bg-gray-800 text-white rounded-lg shadow-lg p-6 flex flex-col items-center w-full h-full";

    const title: HTMLHeadingElement = document.createElement("h3");
    title.innerHTML = translatedStats;
    title.className = "text-2xl font-bold mb-4 text-center";

    const statsContainer: HTMLDivElement = document.createElement("div");
    statsContainer.className = "flex flex-col lg:flex-row items-center justify-center w-full gap-8";

    const statsList: HTMLDivElement = document.createElement("div");
    statsList.className = "text-white flex flex-col space-y-3 w-full max-w-md";

    const chartContainer: HTMLDivElement = document.createElement("div");
    chartContainer.className = "w-48 h-48";

    async function fetchStats() {
        const targetUserId = userId || state.user?.id;
        if (!targetUserId) {
            statsList.innerHTML = `<p class='text-red-500 font-semibold'>${translatedUserNotFound}</p>`;
            return;
        }
        try {

            const response: Response = await fetch(`/api/user/stats?userId=${targetUserId}`);
            if (!response.ok) {
                throw new Error("Failed to fetch user stats.");
            }

            const stats = await response.json();

            if (!stats || typeof stats.totalGames === "undefined") {
                statsList.innerHTML = `<p class='text-white text-center py-4'>${translatedStatsNotFound}</p>`;
                return;
            }

            const totalGames = stats.totalGames || 0;
            const wins = stats.wins || 0;
            const losses = stats.losses || 0;
            const winrate: number = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

            function createStatItem(label, value, color) {
                const statItem: HTMLDivElement = document.createElement("div");
                statItem.className = "flex flex-col";
                
                const labelEl: HTMLSpanElement = document.createElement("span");
                labelEl.className = "text-gray-400 text-sm";
                labelEl.innerHTML = label;
                
                const valueEl: HTMLSpanElement = document.createElement("span");
                valueEl.className = `text-xl font-bold ${color}`;
                valueEl.innerHTML = value;
                
                statItem.append(labelEl, valueEl);
                return statItem;
            }

            statsList.innerHTML = "";
            
            statsList.appendChild(createStatItem( translatedTotalGames, totalGames, "text-blue-400"));
            
            statsList.appendChild(createStatItem(translatedWins, wins, "text-green-500"));
            
            statsList.appendChild(createStatItem(translatedLosses, losses, "text-red-500"));
            
            statsList.appendChild(createStatItem(translatedWinRates, `${winrate}%`, "text-yellow-400"));

            renderChart(wins, losses);
        } catch (error) {
            statsList.innerHTML = "<p class='text-red-500 font-bold'>Error loading stats.</p>";
        }
    }

    function renderChart(wins, losses) {
        chartContainer.innerHTML = "";
        const canvas: HTMLCanvasElement = document.createElement("canvas");
        canvas.width = 200;
        canvas.height = 200;
        chartContainer.appendChild(canvas);

        new Chart(canvas, {
            type: "doughnut",
            data: {
                labels: [translatedWins, translatedLosses],
                datasets: [{
                    data: [wins, losses],
                    backgroundColor: ["#10B981", "#EF4444"],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                cutout: '70%',
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            color: 'white',
                            font: {
                                size: 12
                            },
                            padding: 20
                        }
                    }
                }
            }
        });
    }

    fetchStats();
    statsContainer.append(statsList, chartContainer);
    container.append(title, statsContainer);
    return container;
}
