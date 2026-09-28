const assert = require('assert');

// 1. Matriz de configuración extraída de script.js
const roomConfigs = {
    'Casita Mágica': {
        capacities: [2, 3, 4],
        decorations: [
            { name: 'Ninguna', price: 0 },
            { name: 'Decoración Estándar', price: 59000 },
            { name: 'Decoración Elios', price: 180000 }
        ]
    },
    'Suite Orquídeas': {
        capacities: [2, 3, 4],
        decorations: [
            { name: 'Ninguna', price: 0 },
            { name: 'Decoración Elios', price: 180000 }
        ]
    },
    'Suite Aves del Paraíso': {
        capacities: [2],
        decorations: [
            { name: 'Ninguna', price: 0 },
            { name: 'Decoración Estándar', price: 59000 },
            { name: 'Decoración Pétalos', price: 85000 },
            { name: 'Decoración Globos', price: 125000 },
            { name: 'Decoración Velas', price: 136000 },
            { name: 'Decoración Elios', price: 140000 }
        ]
    },
    'Suite Margaritas': {
        capacities: [2],
        decorations: [
            { name: 'Ninguna', price: 0 },
            { name: 'Decoración Estándar', price: 59000 },
            { name: 'Decoración Pétalos', price: 85000 },
            { name: 'Decoración Globos', price: 125000 },
            { name: 'Decoración Velas', price: 136000 },
            { name: 'Decoración Elios', price: 140000 }
        ]
    },
    'Suite Eugenias': {
        capacities: [2, 3, 4, 5, 6, 7, 8],
        decorations: [
            { name: 'Ninguna', price: 0 },
            { name: 'Decoración Pizarra', price: 70000 },
            { name: 'Decoración Elios', price: 180000 }
        ]
    },
    'Pasadía': {
        capacities: [2],
        decorations: [
            { name: 'Ninguna', price: 0 }
        ]
    }
};

const spaConfig = {
    'Ninguno': 0,
    'Spa Relajante 1p': 95000,
    'Spa Relajante 2p': 165000,
    'Spa Piedras 1p': 140000,
    'Spa Piedras 2p': 240000
};

// 2. Función pura de cálculo de tarifa (la misma lógica de script.js)
function calculateStayPrice({ suite, subplan, people, isWeek, decorPrice = 0, spaPrice = 0 }) {
    let accommodationPrice = 0;

    if (suite === 'Casita Mágica') {
        if (subplan === 'Plan Relax') accommodationPrice = 200000;
        else if (subplan === 'Plan Spa') accommodationPrice = 359900;
        else if (subplan === 'Plan Full') accommodationPrice = 399900;

        const extraPeople = Math.max(0, people - 2);
        accommodationPrice += extraPeople * 30000;
    } 
    else if (suite === 'Suite Orquídeas') {
        if (isWeek) {
            if (people === 2) accommodationPrice = 590000;
            else if (people === 3) accommodationPrice = 710000;
            else if (people >= 4) accommodationPrice = 810000;
        } else {
            if (people === 2) accommodationPrice = 650000;
            else if (people === 3) accommodationPrice = 770000;
            else if (people >= 4) accommodationPrice = 880000;
        }
    } 
    else if (suite === 'Suite Aves del Paraíso' || suite === 'Suite Margaritas') {
        accommodationPrice = isWeek ? 420000 : 490000;
    } 
    else if (suite === 'Suite Eugenias') {
        let basePrice = 0;
        if (isWeek) {
            if (people === 2) basePrice = 590000;
            else if (people === 3) basePrice = 710000;
            else if (people >= 4) basePrice = 810000;
        } else {
            if (people === 2) basePrice = 650000;
            else if (people === 3) basePrice = 770000;
            else if (people >= 4) basePrice = 880000;
        }
        const extraPeople = Math.max(0, people - 4);
        accommodationPrice = basePrice + (extraPeople * 160000);
    } 
    else if (suite === 'Pasadía') {
        accommodationPrice = isWeek ? 320000 : 360000;
    }

    return accommodationPrice + decorPrice + spaPrice;
}

// 3. Regla de detección de día de semana según fecha
function isWeekdayDate(dateStr, suite) {
    const dateObj = new Date(dateStr + 'T00:00:00');
    const day = dateObj.getDay(); // 0 = Domingo, ..., 6 = Sábado
    if (suite === 'Pasadía') {
        // En Pasadía, aplica de Lunes a Viernes y Domingos (0, 1, 2, 3, 4, 5). El sábado (6) es la otra tarifa.
        return day !== 6;
    } else {
        // En suites generales, aplica de Domingo a Jueves (0 a 4).
        return day >= 0 && day <= 4;
    }
}

// --- SUITE DE PRUEBAS TDD ---
console.log('🧪 INICIANDO SUITE DE PRUEBAS TDD: DAPA GLAMPING');

let passedTests = 0;
function test(name, fn) {
    try {
        fn();
        console.log(`  ✅ [PASS] ${name}`);
        passedTests++;
    } catch (err) {
        console.error(`  ❌ [FAIL] ${name}`);
        console.error(`     Error: ${err.message}`);
        process.exit(1);
    }
}

// TEST 1: Casita Mágica - Precios de planes y personas extra
test('Casita Mágica Plan Relax (2 personas) = $200.000', () => {
    const total = calculateStayPrice({ suite: 'Casita Mágica', subplan: 'Plan Relax', people: 2, isWeek: false });
    assert.strictEqual(total, 200000);
});

test('Casita Mágica Plan Relax (4 personas, 2 extra a $30k c/u) = $260.000', () => {
    const total = calculateStayPrice({ suite: 'Casita Mágica', subplan: 'Plan Relax', people: 4, isWeek: false });
    assert.strictEqual(total, 260000);
});

test('Casita Mágica Plan Spa (2 personas) = $359.900', () => {
    const total = calculateStayPrice({ suite: 'Casita Mágica', subplan: 'Plan Spa', people: 2, isWeek: false });
    assert.strictEqual(total, 359900);
});

test('Casita Mágica Plan Full (2 personas) = $399.900', () => {
    const total = calculateStayPrice({ suite: 'Casita Mágica', subplan: 'Plan Full', people: 2, isWeek: false });
    assert.strictEqual(total, 399900);
});

// TEST 2: Suite Orquídeas - Días de semana vs fin de semana
test('Suite Orquídeas - Entre semana (Dom-Jue) 2 personas = $590.000', () => {
    const total = calculateStayPrice({ suite: 'Suite Orquídeas', people: 2, isWeek: true });
    assert.strictEqual(total, 590000);
});

test('Suite Orquídeas - Fin de semana 4 personas = $880.000', () => {
    const total = calculateStayPrice({ suite: 'Suite Orquídeas', people: 4, isWeek: false });
    assert.strictEqual(total, 880000);
});

// TEST 3: Suite Margaritas y Aves del Paraíso
test('Suite Margaritas - Fin de semana = $490.000', () => {
    const total = calculateStayPrice({ suite: 'Suite Margaritas', people: 2, isWeek: false });
    assert.strictEqual(total, 490000);
});

test('Suite Aves del Paraíso - Entre semana = $420.000', () => {
    const total = calculateStayPrice({ suite: 'Suite Aves del Paraíso', people: 2, isWeek: true });
    assert.strictEqual(total, 420000);
});

// TEST 4: Suite Eugenias - Grupos grandes con excedente
test('Suite Eugenias - Fin de semana 4 personas (base) = $880.000', () => {
    const total = calculateStayPrice({ suite: 'Suite Eugenias', people: 4, isWeek: false });
    assert.strictEqual(total, 880000);
});

test('Suite Eugenias - Fin de semana 8 personas (4 base + 4 extra a $160k c/u) = $1.520.000', () => {
    const total = calculateStayPrice({ suite: 'Suite Eugenias', people: 8, isWeek: false });
    assert.strictEqual(total, 1520000);
});

test('Suite Eugenias - Entre semana 6 personas (4 base $810k + 2 extra $320k) = $1.130.000', () => {
    const total = calculateStayPrice({ suite: 'Suite Eugenias', people: 6, isWeek: true });
    assert.strictEqual(total, 1130000);
});

// TEST 5: Pasadía
test('Pasadía - Lunes a viernes y domingos = $320.000', () => {
    const total = calculateStayPrice({ suite: 'Pasadía', people: 2, isWeek: true });
    assert.strictEqual(total, 320000);
});

test('Pasadía - Solo sábados = $360.000', () => {
    const total = calculateStayPrice({ suite: 'Pasadía', people: 2, isWeek: false });
    assert.strictEqual(total, 360000);
});

// TEST 6: Servicios adicionales combinados (Decoración + Spa)
test('Combinado: Suite Orquídeas (fin de semana 2p: $650k) + Decoración Elios ($180k) + Spa Relajante 2p ($165k) = $995.000', () => {
    const total = calculateStayPrice({
        suite: 'Suite Orquídeas',
        people: 2,
        isWeek: false,
        decorPrice: 180000,
        spaPrice: 165000
    });
    assert.strictEqual(total, 995000);
});

// TEST 7: Regla de días de la semana
test('Detección de días: 2026-09-20 (Domingo) es tarifa entre semana para suites', () => {
    assert.strictEqual(isWeekdayDate('2026-09-20', 'Suite Margaritas'), true);
});

test('Detección de días: 2026-09-25 (Viernes) es fin de semana para suites', () => {
    assert.strictEqual(isWeekdayDate('2026-09-25', 'Suite Margaritas'), false);
});

test('Detección de días: 2026-09-26 (Sábado) para Pasadía es tarifa sábado ($360k)', () => {
    assert.strictEqual(isWeekdayDate('2026-09-26', 'Pasadía'), false);
});

test('Detección de días: 2026-09-27 (Domingo) para Pasadía es tarifa general ($320k)', () => {
    assert.strictEqual(isWeekdayDate('2026-09-27', 'Pasadía'), true);
});

console.log(`\n🎉 RESULTADO FINAL: ${passedTests} de ${passedTests} pruebas pasaron exitosamente.`);
