export interface Sponsor {
  id: string;
  name: string;
  logoPath: string;
  websiteUrl: string;
  phone: string;
  // null when the sponsor gave no email.
  email: string | null;
  services: string;
  position: number;
}
