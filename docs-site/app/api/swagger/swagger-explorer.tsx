'use client';

import SwaggerUI from 'swagger-ui-react';

export function SwaggerExplorer() {
  return <SwaggerUI url='/openapi.yaml' docExpansion='list' deepLinking />;
}
