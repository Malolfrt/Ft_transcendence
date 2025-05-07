import { loadAuthData } from "./services/auth";
import { initRouter } from "./router";
import { state } from "./state";

window.addEventListener('beforeunload', function() {
    sessionStorage.setItem('refreshing', 'true');
});

window.addEventListener('load', function() {
    const wasRefreshing = sessionStorage.getItem('refreshing');
    if (wasRefreshing) {
        sessionStorage.removeItem('refreshing');
    }
    
    loadAuthData();
    initRouter();
}); 