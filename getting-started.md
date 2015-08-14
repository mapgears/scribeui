---
title: ScribeUI - Getting started with ScribeUI
layout: default
---

# Getting started with ScribeUI

- [Before you start](#before-you-start)
- [Creating your first workspace](#creating-your-first-workspace)
- [The Manager](#the-manager)
	- [Creating a map](#creating-a-map)
- [The Editor](#the-editor)
- [The File Browser](#the-file-browser)

## Before you start

If you haven't installed ScribeUI yet, see [this guide](installation.html) first.

## Creating your first workspace

Workspaces could be compared to projects in other development environments. They can contain multiple maps and points of interest. You will need to create one in order to use ScribeUI.

To access ScribeUI, open your web browser and go to the address where it is running, which is 127.0.0.1 by default. You should see this on your screen:

![Workspaces](https://cloud.githubusercontent.com/assets/2997638/7813993/252a37de-038d-11e5-926c-09892fcc037e.png)

The _default_ workspace contains the map templates. Its password is "default". It is recommended that you don't change anything in this workspace, unless you want to add templates.

Instead, press on **Create workspace** to create a new workspace. A popup will ask you for a name and a password. Enter the name you want to give to your workspace, a password if you want one, then press **Create**.

You will now see your workspace in the dropdown menu where _default_ was written earlier. To delete the selected workspace, press on **Delete Workspace**. To access it, press on **Open Workspace**.

## The Manager

After you've logged in to your new workspace, you will see this:

![Manager](https://cloud.githubusercontent.com/assets/2997638/9281301/21612506-4292-11e5-96ba-455caf2eafc4.png)

This is the **Manager** tab, where you will find and create the maps in your workspace. On the upper left corner of the screen, there are two other tabs, **Editor** and **Browse**. These tabs won't be useful without a map, so they will be described later. On the upper right corner of the screen, there is a dropdown menu with the workspace's name. To return to the login screen, press on your workspace's name then **Logout**. On the bottom right, there is a dropdown menu. This is the **Points of interest** dropdown, which will also be described after we have a map.

### Creating a map

Press on the **New Map** button on the left side of the screen to create a map. A popup will open:

![Creating a new map](https://cloud.githubusercontent.com/assets/2997638/7815407/26e82d02-0396-11e5-8c41-6f718649e208.png)

The **Name** field is where you enter the map's name. The **Type** dropdown will give you two choices:
 * **Scribe** will create a map using the Scribe syntax, select this option for the tutorial
 * **Standard** will use the regular Mapfile syntax

Leave the **Template** field with _default_, and you can add text in the **Description** field if you want.

If you press on the **+** button at the bottom of the screen, two more options will appear. **Workspace** lets you select a workspace other than _default_ to select your template from, and password is the **Password** to that workspace if there is one.

When you're done, press on the **Create** button to create the map. It will now appear on the left part of the screen. Press on its thumbnail to show a preview and a few options:

![Previewing a map](https://cloud.githubusercontent.com/assets/2997638/9281398/c881bb70-4292-11e5-9cf7-0b88d58b64df.png)

Under the preview of the map, you will find seven options:
 * **Open map**: Opens the map in the right side of the screen, allows using the **Editor** and **Browse** tabs
 * **Export map**: Export the map to a .zip file
 * **Delete map**: Deletes the map from the workspace
 * **Configure**: Use this to set a Git URL
 * **Pull**: Pulls the latest version of the configured project using Git
 * **Push**: Pushes the project using Git
 * **Mapcache**: Create tiling jobs

Press on **Open map** to open your new map. You should see a map of the world. On the bottom right of the screen, the **Points of interest** dropdown should now be usable. You can add a shortcut to your current view by pressing the **+** button in the dropdown, and remove the selected point of interest by pressing the **-** button.

## The Editor

With your map open, you can now access the **Editor** tab, the second tab located in the upper left corner of your screen. In this interface, you will be able to modify the map:

![Editor view](https://cloud.githubusercontent.com/assets/2997638/9281446/2becfe54-4293-11e5-8ae9-cd7f05961275.png)

On the top left, there are two dropdown menus. In the first one, you have these options:

* **Groups**: These are the layers of the map. If selected, the left part of the screen will only show the layer selected in the second dropdown. Otherwise, the layer selected will appear in the bottom left corner of the screen.
* **Map**: This section is the Map section of a regular Mapfile. If the active map has been set to use the Scribe syntax, the code in the editor will also use that syntax. This is true for every option.
* **Variables**: The Scribe variables. This section will be empty if the map wasn't set to use the Scribe syntax since regular mapfiles do not have variables.
* **Scales**: The numerical values for every scale level.
* **Symbols**: The symbols definition file.
* **Fonts**: The fonts to be used with the map.
* **Projection**: The projection(s) to be used with the map.
* **ReadMe**: You can fill this file with useful information about the map.

The second dropdown contains the layers in the map. The tool button next to it lets you change the order of the layers, as well as add or remove a layer.

## The File Browser

The third tab in the upper left corner is the **Browse tab**. You can access it when a map is opened:

![Browser](https://cloud.githubusercontent.com/assets/2997638/7819547/7df6805c-03b0-11e5-888c-40903e208d3b.png)

This viewer is useful to check if any file is missing or to do simple modifications. For more informations on how to use this file browser, see the [elFinder wiki](https://github.com/Studio-42/elFinder/wiki)
