/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2012 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Christopher Zuendorf (czuendorf)

************************************************************************ */

/**
 * Mobile page responsible for showing all basic widgets available:
 * - Labels
 * - Atoms
 * - Images
 * - Buttons
 * - Collapsible
 * - Enabled / Disabled state
 */
qx.Class.define("mobileshowcase.page.Basic",
{
  extend : qx.ui.mobile.page.NavigationPage,

  construct : function()
  {
    this.base(arguments,false);
    this.setTitle("Basic Widgets");
    this.setShowBackButton(true);
    this.setBackButtonText("Back");
  },


  members :
  {
    // overridden
    _initialize : function()
    {
      this.base(arguments);

      // BASIC WIDGET CHANGE MENU
      this.getContent().add(new qx.ui.mobile.form.Title("Widget Modes"));

      // TOGGLE BUTTON
      var toggleEnableButton = new qx.ui.mobile.form.ToggleButton(true,"Enable","Disable");

      toggleEnableButton.addListener("changeValue", function(e) {
        exImage.toggleEnabled();
        exToggleButton.toggleEnabled();
        exLabel.toggleEnabled();
        exButton.toggleEnabled();
        exAtomLeft.toggleEnabled();
        exAtomRight.toggleEnabled();
        exAtomTop.toggleEnabled();
        exAtomBottom.toggleEnabled();
        collapsible.toggleEnabled();
      }, this);


      // TOGGLE LABEL WRAP BUTTONT
      var toggleLabelWrapButton = new qx.ui.mobile.form.ToggleButton(true,"Wrap","Ellipsis");
      toggleLabelWrapButton.addListener("changeValue", function(e) {
        exLabel.toggleWrap();
      }, this);

      // WIDGETS 4 EXAMPLE
      var exButton = new qx.ui.mobile.form.Button("Button");

      var exToggleButton = new qx.ui.mobile.form.ToggleButton(false);

      var labelText = "qx.Mobile is a sophisticated HTML5 framework. It provides specific UI widgets for touch devices, handling of mobile events like swiping, custom theming and much more. It is suitable for mobile web browsers on platforms such as Android, iOS, WP8 or BlackBerry 10.";

      var exLabel = new qx.ui.mobile.basic.Label(labelText);
      exLabel.addCssClass("space-top");

      var exImage = new qx.ui.mobile.basic.Image("mobileshowcase/icon/mobile.png");

      // ATOMS
      var positions = [ "left", "right", "top", "bottom" ]

      var iconSrc = "mobileshowcase/icon/mobile.png";
      var exAtomLeft = new qx.ui.mobile.basic.Atom("Icon Position: left", iconSrc);
      exAtomLeft.setIconPosition(positions[0]);
      exAtomLeft.addCssClass("space-top");

      var exAtomRight = new qx.ui.mobile.basic.Atom("Icon Position: right", iconSrc);
      exAtomRight.setIconPosition(positions[1]);
      exAtomRight.addCssClass("space-top");

      var exAtomTop = new qx.ui.mobile.basic.Atom("Icon Position: top", iconSrc);
      exAtomTop.setIconPosition(positions[2]);
      exAtomTop.addCssClass("space-top");

      var exAtomBottom = new qx.ui.mobile.basic.Atom("Icon Position: bottom", iconSrc);
      exAtomBottom.setIconPosition(positions[3]);
      exAtomBottom.addCssClass("space-top");

      var collapsible = this._createCollapsible();

      // BUILD VIEW

      var menuGroup = new qx.ui.mobile.form.Group([toggleEnableButton,toggleLabelWrapButton]);
      this.getContent().add(menuGroup);

      this.getContent().add(new qx.ui.mobile.form.Title("Button"));
      var buttonGroup = new qx.ui.mobile.form.Group([exButton],false);
      this.getContent().add(buttonGroup);

      this.getContent().add(new qx.ui.mobile.form.Title("ToggleButton"));

      var toggleButtonGroup = new qx.ui.mobile.form.Group;
      toggleButtonGroup.add(exToggleButton);
      this.getContent().add(toggleButtonGroup);

      this.getContent().add(new qx.ui.mobile.form.Title("Label"));

      var labelGroup = new qx.ui.mobile.form.Group();
      labelGroup.add(exLabel);
      this.getContent().add(labelGroup);

      this.getContent().add(new qx.ui.mobile.form.Title("Image"));

      var imageGroup = new qx.ui.mobile.form.Group([exImage],false);
      this.getContent().add(imageGroup);

      this.getContent().add(new qx.ui.mobile.form.Title("Collapsible"));
      this.getContent().add(new qx.ui.mobile.form.Group([collapsible],false));

      this.getContent().add(new qx.ui.mobile.form.Title("Atoms"));

      var atomGroup = new qx.ui.mobile.form.Group([exAtomLeft,exAtomTop,exAtomRight,exAtomBottom]);
      this.getContent().add(atomGroup);
    },


    _createCollapsible : function() {
      var collapsible = new qx.ui.mobile.container.Collapsible("Collapsible Header");
      var label = new qx.ui.mobile.basic.Label("This is the content of the Collapsible.");
      collapsible.add(label);
      return collapsible;
    },


    // overridden
    _back : function()
    {
     qx.core.Init.getApplication().getRouting().executeGet("/", {reverse:true});
    }
  }
});
