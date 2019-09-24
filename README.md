# Export Licence Visualiser (Hack Day project)

As part of a hack day project I decided to try and visualise the [UK strategic export control data](https://www.gov.uk/government/uploads/system/uploads/attachment_data/file/815559/2019Q1-table-e-siels-issued-siels-by-licence-type-sub--type-and-end-user-destination.csv/preview) on a 3D globe. The aim was to plot the export location on a globe and have the colour of the route represent the value of the exports to that country.

![alt text](http://www.danielashworth.co.uk/export-licence-visualiser.PNG "Export Licence Visualiser")

## Frameworks & Libraries

The base application is written using [React](https://reactjs.org/).

The 3D graphics uses [three.js](https://threejs.org/) and [D3](https://d3js.org/)

## Build

### Development

To run the application locally run `npm start`

Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.

You will also see any lint errors in the console.

### Production

Run `npm run build` to create a production build to the `build` folder.<br>
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.
