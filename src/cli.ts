#!/usr/bin/env node
import { main } from './index';

main().catch((error) => {
  console.error('Error running ctx:', error);
  process.exit(1);
});
