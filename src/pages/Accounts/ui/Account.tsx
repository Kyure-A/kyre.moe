import type { CSSProperties, ReactNode } from "react";
import { css, cx } from "styled-system/css";

export type AccountProps = {
  id: string;
  description?: string;
  serviceUrl: string;
  serviceIcon: ReactNode;
  platform: string;
  accentColor: string;
  iconClassName?: string;
};

const styles = {
  link: css({
    display: "block",
    width: "full",
    px: "2",
    "&:is(:hover, :active, :focus-visible, [data-hover], [data-active], [data-focus-visible]) [data-account-row]": {
      px: { base: "4", sm: "account-row-hover" },
      borderRadius: "item",
      backgroundColor: "accent.dynamic",
      color: "white",
      textShadow: "accountText",
    },
    "&:is(:hover, :active, :focus-visible, [data-hover], [data-active], [data-focus-visible]) [data-account-primary]": {
      color: "white",
    },
    "&:is(:hover, :active, :focus-visible, [data-hover], [data-active], [data-focus-visible]) [data-account-platform]": {
      mr: "1",
      color: "white",
    },
    "&:is(:hover, :active, :focus-visible, [data-hover], [data-active], [data-focus-visible]) [data-account-description]": {
      color: "whiteAlpha90",
    },
  }),
  row: css({
    display: "flex",
    width: "full",
    alignItems: "center",
    gap: { base: "3", sm: "5" },
    px: "0",
    py: { base: "2", sm: "3" },
    color: "text.primary",
    transition: "all",
    transitionDuration: "slower",
    transitionTimingFunction: "easeOut",
  }),
  icon: css({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: { base: "icon-sm", sm: "icon-md" },
    height: { base: "icon-sm", sm: "icon-md" },
    color: "text.primary",
    fontSize: { base: "icon-md", sm: "icon-lg" },
    transitionProperty: "colors",
    transitionDuration: "slower",
    transitionTimingFunction: "easeOut",
  }),
  content: css({
    display: "flex",
    minWidth: "0",
    flex: "1",
    alignItems: "center",
  }),
  platform: css({
    mr: { base: "2", sm: "5" },
    width: { base: "account-platform", md: "account-platform-md" },
    flexShrink: "0",
    whiteSpace: "nowrap",
    fontSize: { base: "account-xs", sm: "account-md", md: "account-lg" },
    fontWeight: "semibold",
    lineHeight: "tight",
    color: "text.primary",
    transition: "all",
    transitionDuration: "slower",
    transitionTimingFunction: "easeOut",
  }),
  copy: css({
    minWidth: "0",
    display: "flex",
    flexDirection: "column",
    minHeight: "account-copy",
  }),
  copyCentered: css({
    justifyContent: "center",
  }),
  id: css({
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontSize: { base: "account-xs", sm: "account-md", md: "account-lg" },
    lineHeight: "tight",
    color: "text.primary",
    transitionProperty: "colors",
    transitionDuration: "slower",
    transitionTimingFunction: "easeOut",
  }),
  description: css({
    mt: { base: "0.5", sm: "1" },
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontSize: { base: "account-xs", sm: "account-sm" },
    lineHeight: "snug",
    color: "text.tertiary",
    transitionProperty: "colors",
    transitionDuration: "slower",
    transitionTimingFunction: "easeOut",
  }),
};

const Account = (props: AccountProps) => {
  const accentStyle = {
    "--accent": props.accentColor,
    "--colors-accent-dynamic": props.accentColor,
  } as CSSProperties;

  const descriptionText = props.description ?? "";
  const hasDescription = descriptionText.trim().length > 0;
  return (
    <li>
      <a
        href={props.serviceUrl}
        className={styles.link}
        style={accentStyle}
      >
        <div className={styles.row} data-account-row="">
          <span
            className={cx(styles.icon, props.iconClassName)}
            data-account-primary=""
          >
            {props.serviceIcon}
          </span>
          <div className={styles.content}>
            <span
              className={styles.platform}
              data-account-primary=""
              data-account-platform=""
            >
              {props.platform}
            </span>
            <div
              className={cx(styles.copy, !hasDescription && styles.copyCentered)}
            >
              <p
                className={styles.id}
                data-account-id=""
                data-account-primary=""
              >
                {props.id}
              </p>
              {hasDescription ? (
                <p className={styles.description} data-account-description="">
                  {descriptionText}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </a>
    </li>
  );
};

export default Account;
