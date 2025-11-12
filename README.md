# Proyecto-E19

Proyecto-E19 es un repositorio que guarda el proceso de una aplicación de tutorías. Separado por servidor y cliente donde usamos mongodb como base de datos y docker para la realización de la imagen

## Tabla de contenidos
- [Estado](#estado)
- [Características](#características)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Uso](#uso)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Contribuir](#contribuir)

## Estado
En desarrollo 
  - Desarrollando frontEnd
  - Sing Up
  - ...

## Características
- Descripción corta de la funcionalidad principal.
- Modular y fácil de probar.
- Lista de mejoras planificadas (opcional).

## Requisitos
- Sistema operativo: Linux / macOS / Windows
- Herramientas: git, [node | python | go | otro] según corresponda
- Ajusta esta sección con las versiones concretas y dependencias del proyecto.

## Instalación
1. Clona el repositorio:
  ```
  git clone https://github.com/SyTW2526/Proyecto-E19.git
  cd Proyecto-E19
  ```
2. Instala dependencias:
  - Node:
    ```
    npm install
    ```
  - Docker:
    ```
    sudo snap install docker
    ```

## Uso
- Ejecuta la aplicación :
  ```
  cd server
  sudo docker-compose up --build
  ```
- Tras realizar esto se conectara automaticamente a la BBDD y al backend desplegando
- En el navegador poner http://localhost:4000

## Estructura del proyecto
- README.md — documentación principal
- src/ — código fuente
- tests/ — pruebas automatizadas
- nginx/ — Contenido nginx
- app/ — cliente

## Tests
- De momento no hay


## Contribuir
1. Crea una rama feature/: `git checkout -b feature/nombre`
2. Haz commits pequeños y claros.
3. Abre un pull request con descripción y tests cuando proceda.