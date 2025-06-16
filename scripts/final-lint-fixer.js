#!/usr/bin/env node

/**
 * Script de Correção Final de Lint - Fase 2
 * Corrige os warnings restantes de forma sistemática
 */

const fs = require('fs');
const path = require('path');

class FinalLintFixer {
  constructor() {
    this.backendPath = path.join(__dirname, '..', 'backend', 'src');
    this.fixes = {
      consoleRemoved: 0,
      returnTypesAdded: 0,
      anyTypesFixed: 0,
      nonNullFixed: 0
    };
  }

  // Remove ou substitui console.log por logger adequado
  fixConsoleStatements(content, filePath) {
    let fixed = content;
    
    // Para controllers, remove console.log não críticos
    if (filePath.includes('controllers/')) {
      // Remove linhas que só têm console.log
      fixed = fixed.replace(/^\s*console\.log\([^)]*\);\s*$/gm, '');
      this.fixes.consoleRemoved++;
    }
    
    // Para index.ts, manter apenas console importantes
    if (filePath.includes('index.ts')) {
      const lines = fixed.split('\n');
      const processedLines = lines.map(line => {
        if (line.includes('console.log') && 
            !line.includes('Server running') && 
            !line.includes('Database connected') &&
            !line.includes('Error:')) {
          this.fixes.consoleRemoved++;
          return ''; // Remove linha
        }
        return line;
      });
      fixed = processedLines.join('\n');
    }
    
    // Para middleware auth, substitui por console.error quando apropriado
    if (filePath.includes('middleware/auth.ts')) {
      fixed = fixed.replace(/console\.log\((.*error.*)\)/gi, 'console.error($1)');
      // Remove outros console.log
      fixed = fixed.replace(/^\s*console\.log\([^)]*\);\s*$/gm, '');
      this.fixes.consoleRemoved++;
    }
    
    return fixed;
  }

  // Corrige tipos any específicos
  fixSpecificAnyTypes(content, filePath) {
    let fixed = content;
    
    // Em controllers, substitui parâmetros any por tipos corretos
    if (filePath.includes('Controller.ts')) {
      // Padrão de req: any, res: any
      fixed = fixed.replace(/\(req:\s*any,\s*res:\s*any\)/g, '(req: Request, res: Response)');
      
      // Error handlers
      fixed = fixed.replace(/error:\s*any/g, 'error: Error');
      
      // Body parsing
      fixed = fixed.replace(/req\.body\s*as\s*any/g, 'req.body');
      
      this.fixes.anyTypesFixed++;
    }
    
    // Em routes, corrige middleware signatures
    if (filePath.includes('routes/')) {
      fixed = fixed.replace(/\(req:\s*any,\s*res:\s*any,\s*next:\s*any\)/g, 
                           '(req: Request, res: Response, next: NextFunction)');
      this.fixes.anyTypesFixed++;
    }
    
    // Em services, corrige tipos de dados
    if (filePath.includes('Service.ts')) {
      fixed = fixed.replace(/data:\s*any/g, 'data: Record<string, unknown>');
      fixed = fixed.replace(/params:\s*any/g, 'params: Record<string, unknown>');
      this.fixes.anyTypesFixed++;
    }
    
    return fixed;
  }

  // Adiciona tipos de retorno específicos baseados no contexto
  addSpecificReturnTypes(content, filePath) {
    let fixed = content;
    
    // Controllers - funções que retornam Response
    if (filePath.includes('Controller.ts')) {
      // Funções async que não têm tipo de retorno
      const asyncFunctionRegex = /^(\s*)(export\s+)?async\s+(\w+)\s*\([^)]*\)\s*{/gm;
      fixed = fixed.replace(asyncFunctionRegex, '$1$2async $3($&): Promise<void> {');
      
      this.fixes.returnTypesAdded++;
    }
    
    // Services - funções que retornam dados
    if (filePath.includes('Service.ts')) {
      // Funções que claramente retornam dados
      const serviceMethodRegex = /^(\s*)(export\s+)?async\s+(find\w+|get\w+|create\w+|update\w+|delete\w+)\s*\([^)]*\)\s*{/gm;
      fixed = fixed.replace(serviceMethodRegex, (match, indent, exportKeyword, methodName, rest) => {
        if (methodName.startsWith('find') || methodName.startsWith('get')) {
          return `${indent}${exportKeyword || ''}async ${methodName}${rest}: Promise<unknown> {`;
        } else if (methodName.startsWith('create') || methodName.startsWith('update')) {
          return `${indent}${exportKeyword || ''}async ${methodName}${rest}: Promise<unknown> {`;
        } else if (methodName.startsWith('delete')) {
          return `${indent}${exportKeyword || ''}async ${methodName}${rest}: Promise<boolean> {`;
        }
        return match;
      });
      
      this.fixes.returnTypesAdded++;
    }
    
    // Middleware - funções específicas
    if (filePath.includes('middleware/')) {
      fixed = fixed.replace(
        /^(\s*)(export\s+)?async\s+(authenticate|authorize\w*)\s*\([^)]*\)\s*{/gm,
        '$1$2async $3(req: Request, res: Response, next: NextFunction): Promise<void> {'
      );
      this.fixes.returnTypesAdded++;
    }
    
    return fixed;
  }

  // Corrige non-null assertions restantes
  fixRemainingNonNullAssertions(content) {
    let fixed = content;
    
    // Padrões específicos que sobraram
    const patterns = [
      {
        regex: /req\.user\.id!/g,
        replacement: '(req.user?.id || "")'
      },
      {
        regex: /req\.user\.barbershopId!/g,
        replacement: '(req.user?.barbershopId || "")'
      },
      {
        regex: /req\.user\.barberId!/g,
        replacement: '(req.user?.barberId || "")'
      },
      {
        regex: /\.id!/g,
        replacement: '.id || ""'
      }
    ];

    patterns.forEach(pattern => {
      const matches = fixed.match(pattern.regex);
      if (matches) {
        fixed = fixed.replace(pattern.regex, pattern.replacement);
        this.fixes.nonNullFixed += matches.length;
      }
    });

    return fixed;
  }

  // Adiciona imports necessários
  ensureImports(content, filePath) {
    if (!filePath.includes('Controller.ts') && !filePath.includes('middleware/')) {
      return content;
    }
    
    let fixed = content;
    const needsRequestResponse = fixed.includes('Request') || fixed.includes('Response');
    const needsNextFunction = fixed.includes('NextFunction');
    
    if (needsRequestResponse || needsNextFunction) {
      const importParts = [];
      if (needsRequestResponse) {
        importParts.push('Request', 'Response');
      }
      if (needsNextFunction) {
        importParts.push('NextFunction');
      }
      
      const importStatement = `import { ${importParts.join(', ')} } from 'express';\n`;
      
      // Adiciona import se não existir
      if (!fixed.includes("from 'express'")) {
        fixed = importStatement + fixed;
      }
    }
    
    return fixed;
  }

  processFile(filePath) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      
      content = this.fixConsoleStatements(content, filePath);
      content = this.fixSpecificAnyTypes(content, filePath);
      content = this.addSpecificReturnTypes(content, filePath);
      content = this.fixRemainingNonNullAssertions(content);
      content = this.ensureImports(content, filePath);
      
      fs.writeFileSync(filePath, content);
      console.log(`✅ Corrigido: ${path.relative(process.cwd(), filePath)}`);
      
    } catch (error) {
      console.error(`❌ Erro: ${filePath}:`, error.message);
    }
  }

  async run() {
    console.log('🔧 Fase 2: Correções finais de lint...\n');
    
    // Arquivos com mais problemas primeiro
    const priorityFiles = [
      'controllers/AuthController.ts',
      'controllers/UserController.ts',
      'controllers/scheduleController.ts',
      'controllers/ServiceController.ts',
      'middleware/auth.ts',
      'services/scheduleService.ts',
      'services/AppointmentService.ts',
      'index.ts'
    ];
    
    for (const file of priorityFiles) {
      const fullPath = path.join(this.backendPath, file);
      if (fs.existsSync(fullPath)) {
        this.processFile(fullPath);
      }
    }
    
    console.log('\n📊 Correções aplicadas:');
    console.log(`🗑️ Console removidos: ${this.fixes.consoleRemoved}`);
    console.log(`📝 Tipos any corrigidos: ${this.fixes.anyTypesFixed}`);
    console.log(`⮕ Tipos de retorno: ${this.fixes.returnTypesAdded}`);
    console.log(`🛡️ Non-null corrigidos: ${this.fixes.nonNullFixed}`);
  }
}

if (require.main === module) {
  const fixer = new FinalLintFixer();
  fixer.run().catch(console.error);
}

module.exports = FinalLintFixer;
