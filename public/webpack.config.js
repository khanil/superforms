webpack = require('webpack');
path = require('path');
// var ExtractTextPlugin = require('extract-text-webpack-plugin');


webpackConfig = {
	context: __dirname,
	entry: {
		users: './sources/users.js',
		journal: './sources/journal.js'
	},
	output: {
		filename: '[name].js',
		path: './scripts/'
	},
	resolve: {
		extensions: ['', '.js', '.jsx']
	},
	devtool: '#cheap-module-source-map',
	module: {
		loaders: [
			{
				test: /\.jsx?$/,
				exclude: [/node_modules/],
				loader: "babel-loader",
				query: {
					presets: ['es2015', 'react', 'stage-0', 'stage-1']
				}
			},
			{
				test: /\.woff2?$|\.ttf$|\.eot$|\.svg$|\.png|\.jpe?g|\.gif$/,
				loader: 'file-loader'
			}
		]
	},
	watch: true,
	plugins: []
};
module.exports = webpackConfig;