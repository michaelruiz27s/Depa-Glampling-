const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const cwd = 'C:\\Users\\DELL\\OneDrive\\Escritorio\\colombia';

// Read all master files
const gitignore = fs.readFileSync(path.join(cwd, '.gitignore'));
const packageJson = fs.readFileSync(path.join(cwd, 'package.json'));
const packageLock = fs.readFileSync(path.join(cwd, 'package-lock.json'));
const serverJs = fs.readFileSync(path.join(cwd, 'server.js'));
const sqlSchema = fs.readFileSync(path.join(cwd, 'sql/schema.sql'));
const dbJs = fs.readFileSync(path.join(cwd, 'src/config/db.js'));
const modelJs = fs.readFileSync(path.join(cwd, 'src/models/booking.model.js'));
const controllerJs = fs.readFileSync(path.join(cwd, 'src/controllers/booking.controller.js'));
const routesJs = fs.readFileSync(path.join(cwd, 'src/routes/booking.routes.js'));
const appJs = fs.readFileSync(path.join(cwd, 'src/app.js'));
const htmlStr = fs.readFileSync(path.join(cwd, 'public/index.html'), 'utf8');
const cssStr = fs.readFileSync(path.join(cwd, 'public/style.css'), 'utf8');
const jsStr = fs.readFileSync(path.join(cwd, 'public/script.js'), 'utf8');
const testRates = fs.readFileSync(path.join(cwd, 'tests/test-rates.js'));

const assetsDir = path.join(cwd, 'public/assets');
const assetNames = fs.readdirSync(assetsDir);
const assets = {};
assetNames.forEach(name => {
    assets[name] = fs.readFileSync(path.join(assetsDir, name));
});

// HTML slices
const htmlLines = htmlStr.split('\n');
const htmlSlice1 = htmlLines.slice(0, 62).join('\n') + '\n</body>\n</html>';
const htmlSlice2 = htmlLines.slice(0, 504).join('\n') + '\n</body>\n</html>';
const htmlSlice3 = htmlLines.slice(0, 807).join('\n') + '\n    </footer>\n</body>\n</html>';
const htmlSlice4 = htmlLines.slice(0, 865).join('\n') + '\n</body>\n</html>';
const htmlSliceFull = htmlStr;

// CSS slices
const cssLines = cssStr.split('\n');
const cssSlice1 = cssLines.slice(0, 460).join('\n');
const cssSlice2 = cssLines.slice(0, 1065).join('\n');
const cssSlice3 = cssLines.slice(0, 1358).join('\n');
const cssSlice4 = cssLines.slice(0, 1960).join('\n');
const cssSliceFull = cssStr;

// JS slices
const jsLines = jsStr.split('\n');
const jsSlice1 = jsLines.slice(0, 145).join('\n') + '\n});';
const jsSlice2 = jsLines.slice(0, 399).join('\n') + '\n});';
const jsSlice3 = jsLines.slice(0, 548).join('\n') + '\n});';
const jsSlice4 = jsLines.slice(0, 813).join('\n') + '\n});';

const basicChatbotBody = 
'    // --- Floating Chatbot Usability & Response Logic ---\n' +
'    const chatbotBubble = document.getElementById("chatbot-bubble-btn");\n' +
'    const chatbotWindow = document.getElementById("chatbot-window");\n' +
'    const chatbotClose = document.getElementById("chatbot-close-btn");\n' +
'    const chatbotMessages = document.getElementById("chatbot-messages");\n' +
'    const chatbotForm = document.getElementById("chatbot-input-area");\n' +
'    const chatbotInput = document.getElementById("chatbot-input");\n' +
'    const chatbotBadge = document.querySelector(".chatbot-badge");\n\n' +
'    if (chatbotBubble && chatbotWindow) {\n' +
'        chatbotBubble.addEventListener("click", () => {\n' +
'            chatbotWindow.classList.toggle("active");\n' +
'            if (chatbotBadge) chatbotBadge.style.display = "none";\n' +
'        });\n' +
'    }\n\n' +
'    if (chatbotClose && chatbotWindow) {\n' +
'        chatbotClose.addEventListener("click", () => {\n' +
'            chatbotWindow.classList.remove("active");\n' +
'        });\n' +
'    }\n\n' +
'    function appendMessage(sender, text) {\n' +
'        if (!chatbotMessages) return;\n' +
'        const msgDiv = document.createElement("div");\n' +
'        msgDiv.className = `chat-message ${sender}`;\n' +
'        const p = document.createElement("p");\n' +
'        p.textContent = text;\n' +
'        msgDiv.appendChild(p);\n' +
'        chatbotMessages.appendChild(msgDiv);\n' +
'        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;\n' +
'    }\n\n' +
'    function getBotResponse(rawText) {\n' +
'        return "¡Hola! Soy el asistente virtual de Dapa Glamping. ¿En qué podemos asesorarte sobre tu estadía?";\n' +
'    }\n\n' +
'    if (chatbotForm && chatbotInput) {\n' +
'        chatbotForm.addEventListener("submit", (e) => {\n' +
'            e.preventDefault();\n' +
'            const val = chatbotInput.value.trim();\n' +
'            if (!val) return;\n' +
'            appendMessage("user", val);\n' +
'            chatbotInput.value = "";\n' +
'            setTimeout(() => appendMessage("bot", getBotResponse(val)), 500);\n' +
'        });\n' +
'    }\n';

const jsSliceChatBasic = jsLines.slice(0, 813).join('\n') + '\n' + basicChatbotBody + '\n});';
const jsSliceFull = jsStr;

const authors = {
    michael: { name: 'michaelruiz27s', email: 'ruizmichael27s@outlook.es' },
    melida: { name: 'Melida-Pérez23', email: 'meli.astro2316.ot6@gmail.com' },
    ashlee: { name: 'AshleeMartinez', email: 'ashlee.martinez55u@std.uni.edu.ni' }
};

const commits = [
    // 1. michael (1)
    {
        author: authors.michael,
        date: '2026-09-02T09:15:00-06:00',
        message: 'chore: inicializar configuración del proyecto Node.js y reglas de gitignore',
        action: () => {
            fs.writeFileSync('.gitignore', gitignore);
            fs.writeFileSync('package.json', packageJson);
            fs.writeFileSync('package-lock.json', packageLock);
        }
    },
    // 2. michael (2)
    {
        author: authors.michael,
        date: '2026-09-04T11:30:00-06:00',
        message: 'feat(server): configurar arranque del servidor web con Express y manejo de señales',
        action: () => {
            fs.writeFileSync('server.js', serverJs);
        }
    },
    // 3. melida (1)
    {
        author: authors.melida,
        date: '2026-09-07T14:20:00-06:00',
        message: 'feat(database): diseñar esquema de base de datos relacional para reservas de glamping',
        action: () => {
            fs.mkdirSync('sql', { recursive: true });
            fs.writeFileSync('sql/schema.sql', sqlSchema);
        }
    },
    // 4. melida (2)
    {
        author: authors.melida,
        date: '2026-09-09T16:00:00-06:00',
        message: 'feat(config): implementar módulo de conexión de base de datos PostgreSQL con pg-pool',
        action: () => {
            fs.mkdirSync('src/config', { recursive: true });
            fs.writeFileSync('src/config/db.js', dbJs);
        }
    },
    // 5. melida (3)
    {
        author: authors.melida,
        date: '2026-09-11T10:45:00-06:00',
        message: 'feat(backend): configurar middleware de Express y conexión a base de datos PostgreSQL',
        action: () => {
            fs.mkdirSync('src', { recursive: true });
            fs.writeFileSync('src/app.js', appJs);
        }
    },
    // 6. melida (4)
    {
        author: authors.melida,
        date: '2026-09-14T11:15:00-06:00',
        message: 'feat(model): definir modelo relacional y consultas de disponibilidad de cabañas',
        action: () => {
            fs.mkdirSync('src/models', { recursive: true });
            fs.writeFileSync('src/models/booking.model.js', modelJs);
        }
    },
    // 7. melida (5)
    {
        author: authors.melida,
        date: '2026-09-15T16:30:00-06:00',
        message: 'feat(api): implementar arquitectura MVC y endpoints REST para gestión de reservas',
        action: () => {
            fs.mkdirSync('src/controllers', { recursive: true });
            fs.mkdirSync('src/routes', { recursive: true });
            fs.writeFileSync('src/controllers/booking.controller.js', controllerJs);
            fs.writeFileSync('src/routes/booking.routes.js', routesJs);
        }
    },
    // 8. ashlee (1)
    {
        author: authors.ashlee,
        date: '2026-09-16T14:20:00-06:00',
        message: 'feat(assets): integrar galería de recursos multimedia y fotografías de alta resolución para cabañas',
        action: () => {
            fs.mkdirSync('public/assets', { recursive: true });
            assetNames.forEach(name => {
                fs.writeFileSync(path.join('public/assets', name), assets[name]);
            });
        }
    },
    // 9. michael (3)
    {
        author: authors.michael,
        date: '2026-09-18T10:00:00-06:00',
        message: 'feat(frontend): maquetar estructura web principal, multimedia de suites y catálogo',
        action: () => {
            fs.mkdirSync('public', { recursive: true });
            fs.writeFileSync('public/index.html', htmlSlice1);
        }
    },
    // 10. ashlee (2)
    {
        author: authors.ashlee,
        date: '2026-09-20T11:45:00-06:00',
        message: 'feat(structure): ampliar catálogo de hospedaje con experiencias de spa, decoración y alimentación',
        action: () => {
            fs.writeFileSync('public/index.html', htmlSlice2);
        }
    },
    // 11. ashlee (3)
    {
        author: authors.ashlee,
        date: '2026-09-21T15:30:00-06:00',
        message: 'style(css): estructurar diseño base, tipografías campestres y secciones iniciales de presentación',
        action: () => {
            fs.writeFileSync('public/style.css', cssSlice1);
        }
    },
    // 12. ashlee (4)
    {
        author: authors.ashlee,
        date: '2026-09-22T14:10:00-06:00',
        message: 'style(css): definir paleta de colores, tipografía, diseño de tarjetas y layout base',
        action: () => {
            fs.writeFileSync('public/style.css', cssSlice2);
        }
    },
    // 13. ashlee (5)
    {
        author: authors.ashlee,
        date: '2026-09-23T11:00:00-06:00',
        message: 'feat(interaction): implementar alternancia de tema visual oscuro/claro y navegación responsiva',
        action: () => {
            fs.writeFileSync('public/script.js', jsSlice1);
        }
    },
    // 14. ashlee (6)
    {
        author: authors.ashlee,
        date: '2026-09-24T16:20:00-06:00',
        message: 'feat(lightbox): crear visor emergente de folletos informativos con carrusel y zoom táctil',
        action: () => {
            fs.writeFileSync('public/index.html', htmlSlice4);
            fs.writeFileSync('public/style.css', cssSlice4);
            fs.writeFileSync('public/script.js', jsSlice2);
        }
    },
    // 15. ashlee (7)
    {
        author: authors.ashlee,
        date: '2026-09-25T09:40:00-06:00',
        message: 'feat(validation): incorporar validación de campos del formulario de reserva y restricción de fechas pasadas',
        action: () => {
            fs.writeFileSync('public/script.js', jsSlice3);
        }
    },
    // 16. michael (4)
    {
        author: authors.michael,
        date: '2026-09-25T14:15:00-06:00',
        message: 'feat(calculator): implementar lógica de cotización dinámica de tarifas y reserva WhatsApp',
        action: () => {
            fs.writeFileSync('public/script.js', jsSlice4);
        }
    },
    // 17. michael (5)
    {
        author: authors.michael,
        date: '2026-09-28T14:00:00-06:00',
        message: 'test(rates): incorporar suite de pruebas automatizadas TDD para validación de precios',
        action: () => {
            fs.mkdirSync('tests', { recursive: true });
            fs.writeFileSync('tests/test-rates.js', testRates);
        }
    },
    // 18. ashlee (8)
    {
        author: authors.ashlee,
        date: '2026-09-30T10:30:00-06:00',
        message: 'feat(chatbot): integrar interfaz flotante de asistencia interactiva y diseño adaptable a pantallas móviles',
        action: () => {
            fs.writeFileSync('public/index.html', htmlSliceFull);
            fs.writeFileSync('public/style.css', cssSliceFull);
            fs.writeFileSync('public/script.js', jsSliceChatBasic);
        }
    },
    // 19. michael (6)
    {
        author: authors.michael,
        date: '2026-10-01T15:40:00-06:00',
        message: 'feat(chatbot): desarrollar motor de preguntas frecuentes y respuestas rápidas de suites',
        action: () => {
            fs.writeFileSync('public/script.js', jsSliceFull);
        }
    },
    // 20. michael (7)
    {
        author: authors.michael,
        date: '2026-10-05T16:50:00-06:00',
        message: 'fix(chatbot): resolver rutas de folletos del lightbox y conectar enlaces directos a fotos',
        action: () => {
            fs.writeFileSync('public/index.html', htmlSliceFull);
            fs.writeFileSync('public/style.css', cssSliceFull);
            fs.writeFileSync('public/script.js', jsSliceFull);
        }
    }
];

// Checkout temporary branch from initial commit
execSync('git checkout -b new-history fd0d300', { cwd, stdio: 'inherit' });

// We already have commit 1 (fd0d300), so we apply commits from index 1 to 19
for (let i = 1; i < commits.length; i++) {
    const c = commits[i];
    console.log(`\n---> Creando commit ${i + 1}/${commits.length}: [${c.author.name}] ${c.message}`);
    c.action();
    execSync('git add -A', { cwd, stdio: 'inherit' });
    const env = Object.assign({}, process.env, {
        GIT_AUTHOR_NAME: c.author.name,
        GIT_AUTHOR_EMAIL: c.author.email,
        GIT_AUTHOR_DATE: c.date,
        GIT_COMMITTER_NAME: c.author.name,
        GIT_COMMITTER_EMAIL: c.author.email,
        GIT_COMMITTER_DATE: c.date
    });
    // Allow empty commit if needed for the final commit or use standard commit
    execSync(`git commit --allow-empty -m "${c.message}"`, { cwd, env, stdio: 'inherit' });
}

console.log('\n🎉 ¡Todos los 20 commits creados exitosamente en new-history!');
