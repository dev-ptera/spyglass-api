const { exec } = require("child_process");

exec(`df / -k --output=avail`,
    (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }

        const freeSpaceDirsStr = stdout.replace(/\n/g, ',');
        const freeSpaceDirs = freeSpaceDirsStr.split(',');

        let availableBytes = 0;
        for (const freeBytes of freeSpaceDirs) {
            let space = Number(freeBytes);
            if (!isNaN(space)) {
                availableBytes+=space;
            }
        }

        /** Returns GB available */
        process.stdout.write(`${availableBytes / 1000 / 1000}`);
    });

