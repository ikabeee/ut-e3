/**
 * Whether a development seed moves the hours of event_settings to "now". The single scripts do (each one prepares a flow
 * that needs its hour to have come); the demo seed does not, so the schedule of the event stays as it is.
 */
export interface DevSeedOptions {
  moveHours: boolean;
}
