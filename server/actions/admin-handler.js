/* @flow */
import type { $Request, $Response } from "express";

function adminHandler(req: $Request, res: $Response) {
  res.render("home.html", {
    name: "Pipl"
  });
}

module.exports = adminHandler;
