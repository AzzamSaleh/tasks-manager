/*
 * Represents one item displayed in the application sidebar.
 */
export interface NavigationItem {
  label: string;
  icon: string;
  route: string;

  /*
   * Some routes are displayed as disabled until
   * their feature is implemented.
   */
  disabled?: boolean;
}