const firebase = require("./config")
var fdb = firebase.database();

const labels = {
  "enhancement": 5,
  "bug": 10,
  "documentation": 50
}

const scores = {
  "issue": 5,
}

// set up router
module.exports = (app, { getRouter }) => {
  const router = getRouter("/api");
  const adminUsernames = ["yashkumarverma", "avats101", "akri16", "DarthBenro008", "HelixW", "vinamrak", "atg_coder27"];
  app.log.info("Yay, the app was loaded!");

  // issues opened
  app.on("issues.opened", async (context) => {
    const issue = context.payload.issue;

    // check if user is admin
    if (adminUsernames.includes(issue.user.login)) {
      app.log(
        `Ignoring new issue ${issue.id} created by admin ${issue.user.login}`
      );
      return;
    }

    // check if issue is opened
    if (!issue.closed_at) {
      app.log(`Issue Opened: ${issue.id}`);
      const comment = context.issue({
        body: `Thanks @${issue.user.login}, for raising the issue!  🙌
  One of our team mates will revert on this soon. ✅`,
      });
      return context.octokit.issues.createComment(comment);
    }
  });

  // issues labelled
  app.on("issues.labeled", async (context) => {
    const issue = context.payload.issue;
    const issueComment = context.issue({
      body: "This issue has been approved by the owner and is open to solve!"
    });

    // Update the scores
    let last_score, last_issues, last_pullRequests
    await fdb.ref("Scores").once("value", function (snapshot) {
      last_score = snapshot.child(issue.user.login + "/finalScore").val();
      last_issues = snapshot.child(issue.user.login + "/issues").val();
      last_pullRequests = snapshot.child(issue.user.login + "/pullRequests").val();
    })
    fdb.ref("Scores/" + issue.user.login).set({
      "finalScore": last_score + scores["issue"],
      "issues": last_issues + 1,
      "pullRequests": last_pullRequests
    })
    const comment = context.issue({
      body: `@${issue.user.login} got ${scores["issue"]} points for this issue! 🎉`,
    })
    context.octokit.issues.createComment(comment)
    return context.octokit.issues.createComment(issueComment);
  });

  // issues closed
  app.on("issues.closed", async (context) => {
    const issueComment = context.issue({
      body: "Thanks for closing this issue!",
    });
    const issue = context.payload.issue;
    let timeline = await context.octokit.rest.issues.listEventsForTimeline(issueComment)
    timeline.data.forEach(async (e) => {
      try {
        if (e.source.issue.pull_request) {
          let list = await context.octokit.rest.issues.listLabelsOnIssue(issueComment)
          data = list["data"][0]
          try {
            label = data.name
            console.log(label)
            let last_score, last_issues
            await fdb.ref("Scores").once("value", function (snapshot) {
              last_score = snapshot.child(e.actor.login + "/finalScore").val();
              last_issues = snapshot.child(e.actor.login + "/issues").val();
              last_pullRequests = snapshot.child(e.actor.login + "/pullRequests").val();
            })
            fdb.ref("Scores/" + e.actor.login).set({
              "finalScore": labels[label] + last_score,
              "issues": last_issues,
              "pullRequests": last_pullRequests + 1
            })
            const comment = context.issue({
              body: `@${issue.user.login} got ${labels[label]} Points`,
            })
            context.octokit.issues.createComment(comment)
          }
          catch {
            app.log("Issue not labelled")
          }
        }
      } catch (e) {
        app.log(e)
      }
    })
    return context.octokit.issues.createComment(issueComment);
  });

  // pull request opened
  app.on("pull_request.opened", async (context) => {
    app.log("created PR");
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

  app.on("pull_request_review_comment.created", async (context) => {
    const pr = context.payload.pull_request_review_comment;
    app.log(`Pull request linked ${pr}`);
  });

  // pr labeled
  app.on("pull_request.labeled", async (context) => {
    app.log("PR Labeled");
    const pr = context.payload.pull_request;
    // Update the scores

    console.log(pr)

    let labels = pr.labels

    // split the label
    label = labels[labels.length - 1].name.toString()
    console.log(label)
    let label_name = label.split(" ")
    console.log(label_name)
    if (label_name[0] == "Points" || label_name[0] == "points") {
      let last_score, last_issues, last_pullRequests
      await fdb.ref("Scores").once("value", function (snapshot) {
        last_score = snapshot.child(pr.user.login + "/finalScore").val();
        last_issues = snapshot.child(pr.user.login + "/issues").val();
        last_pullRequests = snapshot.child(pr.user.login + "/pullRequests").val();
      })
      fdb.ref("Scores/" + pr.user.login).set({
        "finalScore": last_score + parseInt(label_name[1]),
        "issues": last_issues,
        "pullRequests": last_pullRequests + 1
      })
      const comment = context.issue({
        body: `@${pr.user.login} got ${label_name[1]} points for this pull request! 🎉`,
      })
      context.octokit.issues.createComment(comment)
    }

  });

  // pull request closed
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
  Thanks for your contributions. 🙌`,
      });
      return context.octokit.issues.createComment(comment);
    }
  });

  // route for getting scores
  router.get("/scores", (req, res) => {
    fdb.ref('Scores').on('value', async function (snapshot) {
      let scores = snapshot.val()

      // sort the scores
      let sorted = Object.keys(scores).sort(function (a, b) {
        return scores[b].finalScore - scores[a].finalScore
      })

      let sorted_scores = {}
      sorted.forEach((value) => {
        sorted_scores[value] = scores[value]
      })
      return res.send(
        sorted_scores);
    });
  });
};




