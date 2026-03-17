function getSupabasePageErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return "Si e verificato un errore durante il caricamento dei dati.";
  }

  const message = error.message.toLowerCase();

  if (
    message.includes("relation") ||
    message.includes("column") ||
    message.includes("schema cache") ||
    message.includes("does not exist")
  ) {
    return "Il database Supabase non e ancora allineato a questa sezione. Applica prima le migration SQL presenti nella cartella supabase/ e poi ricarica la pagina.";
  }

  return error.message;
}

export { getSupabasePageErrorMessage };
