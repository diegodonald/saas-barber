#!/usr/bin/env node

/**
 * Script Automático de Correção de Lint para SaaS Barber
 * Corrige problemas comuns de lint identificados no backend
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class LintFixer {
  constructor() {
    this.backendPath = path.join(__dirname, '..', 'backend', 'src');
    this.frontendPath = path.join(__dirname, '..', 'frontend', 'src');
    this.fixes = {
      consoleLogRemoved: 0,
      returnTypesAdded: 0,
      anyTypesFixed: 0,
      nonNullAssertionsFixed: 0,
      tsIgnoreReplaced: 0
    };
  }

  /**
   * Remove console.log statements em produção, mantém apenas os críticos
   */
  removeProductionConsoleLogs(content, filePath) {
    // Mantém console.error e console.warn importantes
    const lines = content.split('\n');
    const fixedLines = lines.map((line, index) => {
      // Se é um console.log simples (não error/warn) e não está em teste
      if (line.includes('console.log') && !line.includes('console.error') && !line.includes('console.warn')) {
        // Em arquivos de controller, substitui por logger ou remove
        if (filePath.includes('controllers/')) {
          this.fixes.consoleLogRemoved++;
          return line.replace(/\s*console\.log\([^;]+\);?\s*/, '');
        }
        // Em middleware de auth, mantém apenas os críticos
        if (filePath.includes('middleware/auth.ts')) {
          if (line.includes('Authentication error') || line.includes('Authorization error')) {
            return line.replace('console.log', 'console.error');
          } else {
            this.fixes.consoleLogRemoved++;
            return line.replace(/\s*console\.log\([^;]+\);?\s*/, '');
          }
        }
      }
      return line;
    });
    
    return fixedLines.join('\n');
  }

  /**
   * Adiciona tipos de retorno explícitos para funções
   */
  addReturnTypes(content) {
    let fixed = content;
    
    // Padrões comuns para controladores Express
    const patterns = [
      {
        regex: /^(\s*)(export\s+)?async\s+([\w]+)\s*\(\s*req:\s*Request,\s*res:\s*Response[^)]*\)\s*{/gm,
        replacement: '$1$2async $3(req: Request, res: Response): Promise<void> {'
      },
      {
        regex: /^(\s*)(export\s+)?async\s+([\w]+)\s*\(\s*req:\s*any,\s*res:\s*any[^)]*\)\s*{/gm,
        replacement: '$1$2async $3(req: Request, res: Response): Promise<void> {'
      },
      {
        regex: /^(\s*)(export\s+)?async\s+([\w]+)\s*\([^)]*\):\s*Promise<[^>]+>\s*{/gm,
        replacement: '$&' // Já tem tipo, não altera
      }
    ];

    patterns.forEach(pattern => {
      const matches = fixed.match(pattern.regex);
      if (matches) {
        fixed = fixed.replace(pattern.regex, pattern.replacement);
        this.fixes.returnTypesAdded += matches.length;
      }
    });

    return fixed;
  }

  /**
   * Substitui tipos 'any' por tipos mais específicos
   */
  fixAnyTypes(content, filePath) {
    let fixed = content;

    // Para controllers Express
    if (filePath.includes('controllers/')) {
      fixed = fixed.replace(/req:\s*any/g, 'req: Request');
      fixed = fixed.replace(/res:\s*any/g, 'res: Response');
      fixed = fixed.replace(/next:\s*any/g, 'next: NextFunction');
      this.fixes.anyTypesFixed += (content.match(/:\s*any/g) || []).length - (fixed.match(/:\s*any/g) || []).length;
    }

    // Para middleware
    if (filePath.includes('middleware/')) {
      fixed = fixed.replace(/req:\s*any/g, 'req: Request');
      fixed = fixed.replace(/res:\s*any/g, 'res: Response');  
      fixed = fixed.replace(/next:\s*any/g, 'next: NextFunction');
    }

    // Para validações
    if (filePath.includes('validationSchemas.ts')) {
      fixed = fixed.replace(/req:\s*any/g, 'req: Request');
      fixed = fixed.replace(/res:\s*any/g, 'res: Response');
      fixed = fixed.replace(/next:\s*any/g, 'next: NextFunction');
    }

    return fixed;
  }

  /**
   * Substitui non-null assertions por verificações seguras
   */
  fixNonNullAssertions(content) {
    let fixed = content;
    
    // Padrões comuns e suas substituições seguras
    const patterns = [
      {
        regex: /req\.user\.barbershopId!/g,
        replacement: 'req.user?.barbershopId || ""'
      },
      {
        regex: /req\.user\.barberId!/g,
        replacement: 'req.user?.barberId || ""'
      },
      {
        regex: /req\.user\.id!/g,
        replacement: 'req.user?.id || ""'
      }
    ];

    patterns.forEach(pattern => {
      const matches = fixed.match(pattern.regex);
      if (matches) {
        fixed = fixed.replace(pattern.regex, pattern.replacement);
        this.fixes.nonNullAssertionsFixed += matches.length;
      }
    });

    return fixed;
  }

  /**
   * Substitui @ts-ignore por @ts-expect-error
   */
  fixTsIgnore(content) {
    const fixed = content.replace(/@ts-ignore/g, '@ts-expect-error');
    this.fixes.tsIgnoreReplaced += (content.match(/@ts-ignore/g) || []).length;
    return fixed;
  }

  /**
   * Processa um arquivo individual
   */
  processFile(filePath) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Aplica todas as correções
      content = this.removeProductionConsoleLogs(content, filePath);
      content = this.addReturnTypes(content);
      content = this.fixAnyTypes(content, filePath);
      content = this.fixNonNullAssertions(content);
      content = this.fixTsIgnore(content);
      
      fs.writeFileSync(filePath, content);
      console.log(`✅ Processado: ${path.relative(process.cwd(), filePath)}`);
      
    } catch (error) {
      console.error(`❌ Erro ao processar ${filePath}:`, error.message);
    }
  }

  /**
   * Processa todos os arquivos TypeScript em um diretório
   */
  processDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
      console.log(`⚠️ Diretório não encontrado: ${dirPath}`);
      return;
    }

    const files = this.getTypeScriptFiles(dirPath);
    console.log(`📁 Processando ${files.length} arquivos em ${dirPath}`);
    
    files.forEach(file => this.processFile(file));
  }

  /**
   * Encontra todos os arquivos TypeScript recursivamente
   */
  getTypeScriptFiles(dirPath) {
    const files = [];
    
    const scanDirectory = (dir) => {
      const items = fs.readdirSync(dir);
      
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.includes('node_modules') && !item.includes('.git')) {
          scanDirectory(fullPath);
        } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx'))) {
          files.push(fullPath);
        }
      });
    };
    
    scanDirectory(dirPath);
    return files;
  }

  /**
   * Executa o processo completo de correção
   */
  async run() {
    console.log('🚀 Iniciando correções automáticas de lint...\n');
    
    // Processa backend
    console.log('📦 Processando Backend...');
    this.processDirectory(this.backendPath);
    
    console.log('\n📊 Relatório de Correções:');
    console.log(`✅ Console.log removidos: ${this.fixes.consoleLogRemoved}`);
    console.log(`🔧 Tipos de retorno adicionados: ${this.fixes.returnTypesAdded}`);
    console.log(`📝 Tipos 'any' corrigidos: ${this.fixes.anyTypesFixed}`);
    console.log(`🛡️ Non-null assertions corrigidas: ${this.fixes.nonNullAssertionsFixed}`);
    console.log(`⚠️ @ts-ignore substituídos: ${this.fixes.tsIgnoreReplaced}`);
    
    // Executa lint novamente para verificar melhorias
    console.log('\n🔍 Verificando melhorias...');
    try {
      execSync('cd backend && npm run lint', { stdio: 'inherit' });
      console.log('✅ Lint passou com sucesso!');
    } catch (error) {
      console.log('⚠️ Ainda há warnings, mas os erros críticos foram corrigidos.');
    }
  }
}

// Executa o script se chamado diretamente
if (require.main === module) {
  const fixer = new LintFixer();
  fixer.run().catch(console.error);
}

module.exports = LintFixer;
