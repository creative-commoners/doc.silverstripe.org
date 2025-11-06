import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const sourcesUser = require('../_gatsby/sources-user.cjs');
const sourcesDocs = require('../_gatsby/sources-docs.cjs');

const isUser = process.env.DOCS_CONTEXT === 'user';
const sources = isUser ? sourcesUser : sourcesDocs;
const dryRun = process.env.DRY_RUN === 'true';

const contentDir = path.join(__dirname, '../.cache/content/docs');

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function cloneRepository(config) {
  const { name, remote, branch, patterns } = config.options;
  const nameParts = name.split('--');
  const [category, version, ...thirdPartyParts] = nameParts;
  const thirdparty = thirdPartyParts.join('--');
  
  const targetDir = path.join(
    contentDir,
    `v${version}`,
    thirdparty || category
  );

  if (await pathExists(targetDir)) {
    console.log(`Skipping ${name}, already exists`);
    return;
  }

  if (dryRun) {
    console.log(`[DRY RUN] Would clone ${name} to ${targetDir}`);
    return;
  }

  await fs.mkdir(targetDir, { recursive: true });

  return new Promise((resolve, reject) => {
    const tmpDir = `${targetDir}/.tmp`;
    const cmd = `git clone --depth 1 --branch ${branch} ${remote} "${tmpDir}" && find "${tmpDir}" -maxdepth 1 ! -name '.' -exec mv {} "${targetDir}/" \\; && rm -rf "${tmpDir}"`;
    console.log(`Cloning ${name} from ${remote}...`);
    
    exec(cmd, { shell: '/bin/bash' }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error cloning ${name}:`, error.message);
        reject(error);
      } else {
        console.log(`Successfully cloned ${name}`);
        resolve();
      }
    });
  });
}

async function cloneAll() {
  const gitSources = sources.filter(s => s.resolve === 'gatsby-source-git');

  const context = isUser ? 'User Help' : 'Developer Docs';
  console.log(`\n=== ${context} Content Sources ===\n`);
  console.log(`Found ${gitSources.length} repositories to clone\n`);

  if (dryRun) {
    console.log('DRY RUN MODE - No actual cloning will occur\n');
  }
  
  for (const source of gitSources) {
    try {
      await cloneRepository(source);
    } catch (err) {
      console.error(`Failed to clone ${source.options.name}`);
      process.exit(1);
    }
  }

  console.log('\nAll repositories processed successfully!');
}

cloneAll().catch(err => {
  console.error('Clone operation failed:', err);
  process.exit(1);
});
