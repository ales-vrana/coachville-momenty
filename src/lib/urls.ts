export const momentUrl = (id: string, ref?: string) => `/m/${id}${ref ? `?ref=${ref}` : ""}`;
export const topicUrl = (id: string) => `/tema/${id}`;
export const guestUrl = (slug: string) => `/host/${slug}`;
export const episodeUrl = (slug: string, t?: number) => `/podcast/${slug}${typeof t === "number" ? `?t=${Math.floor(t)}` : ""}`;
export const setUrl = (ids: string[], code?: string) => `/v/#m=${ids.join(",")}${code ? `&o=${code}` : ""}`;
