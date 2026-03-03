const fs = require("fs");
const path = require("path");
const chalk = require("chalk");

const loadRoutes = (app) => {
  try {
    const modulesPath = path.join(__dirname, "../modules");

    if (!fs.existsSync(modulesPath)) {
      console.log(chalk.red("❌ Modules folder not found"));
      return;
    }

    const modules = fs.readdirSync(modulesPath);

    modules.forEach((moduleName) => {
      try {
        const routePath = path.join(
          modulesPath,
          moduleName,
          `${moduleName}.routes.js`
        );

        if (!fs.existsSync(routePath)) {
          console.log(chalk.yellow(`⚠️ No routes file found for module: ${moduleName}`));
          return;
        };

        const router = require(routePath);

        if (!router) {
            console.log(chalk.red(`❌ Invalid router export in ${moduleName}`));
          return;
        };

        const basePath = moduleName === "index" ? "/api/v1" : `/api/v1/${moduleName}`;

        app.use(basePath, router);

        console.log(chalk.green(`✅ Loaded route: ${basePath}`));

      } catch (moduleError) {
        console.log(chalk.red(`❌ Error loading module "${moduleName}": ${moduleError.message}`));
      }
    });

    console.log(chalk.green("✅ All routes loaded successfully"));
  } catch (error) {
    console.log(chalk.red(`❌ Failed to load routes: ${error.message}`));
  }
};

module.exports = loadRoutes;