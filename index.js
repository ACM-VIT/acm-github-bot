const firebase= require("./config")
var fdb = firebase.database();

/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Probot} app
 */


module.exports = (app) => {
  const adminUsernames = [];
  app.log.info("Yay, the app was loaded!");

  //issues opened
  app.on("issues.opened", async (context) => {
    const issue = context.payload.issue;
    if (adminUsernames.includes(issue.user.login)) {
      app.log(
        `Ignoring new issue ${issue.id} created by admin ${issue.user.login}`
      );
      return;
    }
    if (!issue.closed_at) {
      var last_score
      app.log(`Issue Opened: ${issue.id}`);
      await fdb.ref("Scores").once("value", function(snapshot){
        last_score = snapshot.child(issue.user.login+"/score").val();
        
      })
      console.log(last_score);
      fdb.ref("Scores/"+issue.user.login).set({
        "score":5+last_score
      })

      const comment = context.issue({
        body: `Thanks @${issue.user.login}, for raising the issue!  🙌
  One of our team mates will revert on this soon. ✅`,
      });

      return context.octokit.issues.createComment(comment);
    }
  });

  //issues labelled
  app.on("issues.labeled", async (context) => {
    const issueComment = context.issue({
      body: "This issue has been approved by the owner and is open to solve!"
    });
    return context.octokit.issues.createComment(issueComment);
  });

  //issues closed
  app.on("issues.closed", async (context) => {
    const issueComment = context.issue({
      body: "Thanks for closing this issue!",
    });
    return context.octokit.issues.createComment(issueComment);
  });

  //pull request opened
  app.on("pull_request.opened", async (context) => {
    const pr = context.payload.pull_request;
    if (adminUsernames.includes(pr.user.login)) {
      app.log(`Ignoring new pr ${pr.id} opened by admin ${pr.user.login}`);
      return;
    }
    if (!pr.closed_at) {
      app.log(`Pull Request Opened: ${pr.id}`);

      const comment = context.issue({
        body: `Thanks @${pr.user.login}, for opening the pull request!  🙌
  One of our team-mates will review the pull request soon. ✅`,
      });

      return context.octokit.issues.createComment(comment);
    }
  });

  //pull request closed
  app.on("pull_request.closed", async (context) => {
    const pr = context.payload.pull_request;
    if (adminUsernames.includes(pr.user.login)) {
      app.log(`Ignoring pr ${pr.id} closing by admin ${pr.user.login}`);
      return;
    }
    if (!!pr.merged_at) {
      app.log(`Pull Request Closed: ${pr.id}`);

      const comment = context.issue({
        body: `Congratualtions @${pr.user.login}, your pull request is merged! 🎉 
  Thanks for your contributions.🙌`,
      });

      return context.octokit.issues.createComment(comment);
    }
  });

};



