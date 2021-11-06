const { exec } = require("child_process");

// Run every 7 days.
const dayMs = 1000 * 60 * 60 * 24 * 7;

console.log('Started script at time: ');
console.log(new Date().toLocaleTimeString());

const backupUptimeJson = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    const yyyy = today.getFullYear();

    const todayString = mm + '/' + dd + '/' + yyyy;
    console.log(`Committing Representative Uptime Backup for date: ${todayString}`);

    const dir = exec(`git add src/database/rep-uptime/* && git commit -m "[AUTO]: Backup Rep Uptime for ${todayString}" && git push `,
        (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
    });

    dir.on('exit', function (code) {
        console.log("Backup complete; will attempt next backup in 7 days.");
    });
}

backupUptimeJson();
setInterval(() => {
    backupUptimeJson();
}, dayMs)
