const IS_DEV = process.env.APP_VARIANT === "development";
const IS_PREVIEW = process.env.APP_VARIANT === "preview";

const getUniqueIdentifier = () => {
  if (IS_DEV) {
    return "com.nickjuma.buildaid.dev";
  }

  if (IS_PREVIEW) {
    return "com.nickjuma.buildaid.preview";
  }

  return "com.nickjuma.buildaid";
};

const getAppName = () => {
  if (IS_DEV) {
    return "BuildAid (Dev)";
  }

  if (IS_PREVIEW) {
    return "BuildAid (Preview)";
  }

  return "BuildAid";
};

export default ({ config }) => ({
  ...config,
  name: getAppName(),
  ios: {
    ...config.ios,
    bundleIdentifier: getUniqueIdentifier(),
  },
  android: {
    ...config.android,
    package: getUniqueIdentifier(),
  },
});
