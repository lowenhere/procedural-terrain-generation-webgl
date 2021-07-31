module.exports = {
  reactStrictMode: true,
  webpack: (config, options) => {
    config.module.rules.push({
      test: /\.obj$/i,
      use: 'raw-loader'
    });

    return config
  }
}
