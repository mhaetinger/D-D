/** O clique de sincronização envia imagens antes de publicar suas referências.
 * O registro tardio evita rede durante o bootstrap anterior à montagem da ficha. */
let images: { prepare(scope: string): Promise<void>; complete(scope: string): void } | undefined;
export function registerManualImages(hooks: NonNullable<typeof images>) { images = hooks; }
export async function prepareManualImages(scope: string) { await images?.prepare(scope); }
export function completeManualImages(scope: string) { images?.complete(scope); }
