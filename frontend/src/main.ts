import { initRouter } from "./router";
import { loadAuthData } from "./services/auth";

async function init() {

    if (typeof loadAuthData === "function")
        await loadAuthData();

    initRouter();
}

init();
