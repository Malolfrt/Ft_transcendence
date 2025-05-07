all:
	docker-compose up --build -d

init:
	cd frontend && npm install && cd ..
	cd frontend && npm run build && cd ..
	cd backend && npm rebuild && cd ..

down:
	docker-compose down
	docker rmi -f ft_transcendence42-backend
	docker system prune -af --volumes

rebuild: down init all

.PHONY: all init down rebuild