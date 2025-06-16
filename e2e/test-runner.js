"use strict";
/**
 * Test Runner - Utilitário para execução organizada dos testes
 * Facilita a execução de suítes específicas de teste
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.testSuites = void 0;
exports.runTest = runTest;
exports.runAllTests = runAllTests;
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const testSuites = [
    {
        name: 'dashboard',
        file: 'dashboard.spec.ts',
        description: 'Testa funcionalidades do dashboard e métricas',
        tags: ['dashboard', 'metrics', 'ui']
    },
    {
        name: 'appointments',
        file: 'appointments.spec.ts',
        description: 'Testa CRUD e fluxos de agendamentos',
        tags: ['appointments', 'crud', 'status']
    },
    {
        name: 'api-integration',
        file: 'api-integration.spec.ts',
        description: 'Testa integração com APIs do backend',
        tags: ['api', 'integration', 'backend']
    },
    {
        name: 'user-roles',
        file: 'user-roles.spec.ts',
        description: 'Testa permissões e funcionalidades por role',
        tags: ['auth', 'roles', 'permissions']
    },
    {
        name: 'e2e-flow',
        file: 'e2e-flow.spec.ts',
        description: 'Testa fluxo completo end-to-end',
        tags: ['e2e', 'integration', 'complete']
    }
];
exports.testSuites = testSuites;
function printBanner() {
    console.log(`
🧪 ========================================
   SAAS BARBER - TEST RUNNER
   Sistema de Agendamentos
========================================
`);
}
function printTestSuites() {
    console.log('📋 Suítes de Teste Disponíveis:\n');
    testSuites.forEach((suite, index) => {
        const status = (0, fs_1.existsSync)(`./${suite.file}`) ? '✅' : '❌';
        console.log(`${index + 1}. ${status} ${suite.name}`);
        console.log(`   📄 ${suite.file}`);
        console.log(`   📝 ${suite.description}`);
        console.log(`   🏷️  Tags: ${suite.tags.join(', ')}`);
        console.log('');
    });
}
function runTest(suiteName, options = []) {
    const suite = testSuites.find(s => s.name === suiteName);
    if (!suite) {
        console.error(`❌ Suíte de teste '${suiteName}' não encontrada!`);
        return;
    }
    if (!(0, fs_1.existsSync)(`./${suite.file}`)) {
        console.error(`❌ Arquivo ${suite.file} não encontrado!`);
        return;
    }
    console.log(`🚀 Executando: ${suite.name}`);
    console.log(`📝 ${suite.description}\n`);
    const command = `npx playwright test ${suite.file} ${options.join(' ')}`;
    try {
        (0, child_process_1.execSync)(command, {
            stdio: 'inherit',
            cwd: process.cwd()
        });
        console.log(`\n✅ Teste ${suite.name} concluído!`);
    }
    catch (error) {
        console.log(`\n❌ Teste ${suite.name} falhou!`);
        process.exit(1);
    }
}
function runAllTests(options = []) {
    console.log('🚀 Executando todos os testes...\n');
    const availableSuites = testSuites.filter(suite => (0, fs_1.existsSync)(`./${suite.file}`));
    if (availableSuites.length === 0) {
        console.error('❌ Nenhum arquivo de teste encontrado!');
        return;
    }
    let passed = 0;
    let failed = 0;
    for (const suite of availableSuites) {
        console.log(`\n📋 Executando: ${suite.name}`);
        const command = `npx playwright test ${suite.file} ${options.join(' ')}`;
        try {
            (0, child_process_1.execSync)(command, {
                stdio: 'inherit',
                cwd: process.cwd()
            });
            passed++;
            console.log(`✅ ${suite.name} - SUCESSO`);
        }
        catch (error) {
            failed++;
            console.log(`❌ ${suite.name} - FALHOU`);
        }
    }
    console.log(`
📊 RESUMO DA EXECUÇÃO:
✅ Testes Aprovados: ${passed}
❌ Testes Falharam: ${failed}
📋 Total Executado: ${passed + failed}
`);
    if (failed > 0) {
        process.exit(1);
    }
}
function showHelp() {
    console.log(`
🔧 USO:
  node test-runner.js [comando] [opções]

📋 COMANDOS:
  list                    Lista todas as suítes disponíveis
  run <suite>            Executa uma suíte específica
  all                    Executa todas as suítes
  help                   Mostra esta ajuda

🧪 SUÍTES DISPONÍVEIS:
  dashboard              Testes do dashboard e métricas
  appointments           Testes de agendamentos (CRUD)
  api-integration        Testes de integração com API
  user-roles            Testes de roles e permissões
  e2e-flow              Testes end-to-end completos

⚙️  OPÇÕES PLAYWRIGHT:
  --headed               Executa com interface gráfica
  --debug               Modo debug
  --ui                  Interface de debug
  --project=chromium    Executa apenas no Chrome
  --workers=1           Execução sequencial

💡 EXEMPLOS:
  node test-runner.js list
  node test-runner.js run dashboard
  node test-runner.js run appointments --headed
  node test-runner.js all --project=chromium
  node test-runner.js run e2e-flow --debug
`);
}
// Execução principal
function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    const suiteOrOptions = args.slice(1);
    printBanner();
    switch (command) {
        case 'list':
            printTestSuites();
            break;
        case 'run':
            if (!suiteOrOptions[0]) {
                console.error('❌ Especifique uma suíte para executar!');
                console.log('💡 Use: node test-runner.js run <suite>');
                printTestSuites();
                return;
            }
            const suiteName = suiteOrOptions[0];
            const runOptions = suiteOrOptions.slice(1);
            runTest(suiteName, runOptions);
            break;
        case 'all':
            runAllTests(suiteOrOptions);
            break;
        case 'help':
        case '--help':
        case '-h':
            showHelp();
            break;
        default:
            if (!command) {
                printTestSuites();
                console.log('💡 Use "node test-runner.js help" para mais informações');
            }
            else {
                console.error(`❌ Comando '${command}' não reconhecido!`);
                showHelp();
            }
            break;
    }
}
// Executar se chamado diretamente
if (require.main === module) {
    main();
}
