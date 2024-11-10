const mountainWidths = [100, 200, 300];
const triangleHeights = [10, 20, 30];
const mountainIndividualOffsets = [0, -20, -10];
const mountainColors = ['#A57F6E', '#7C5948', '#5D483F'];

const mountainY = height-60;

class Mountain {
    constructor(typeID, offsetX) {
        this.typeID = typeID;
        this.offsetX = offsetX;
    }

    update(){
        this.offsetX -= mountainSpeed;

        // if mountain out of screen, move it to the right of the screen
        if(this.offsetX < mountainWidths[this.typeID]){
            this.offsetX = width;
        }
    }

    display(){
        // second point: triangle position + individual mountain width
        let triangleXright = this.offsetX + mountainWidths[this.typeID];
        // third point: only half of the mountain width
        let triangleXtop = this.offsetX + (mountainWidths[this.typeID]/2);

        if(this.typeID == 1){
            fill(mountainColors[this.typeID]);
            // draw mountain from left-bottom to right-bottom to top
            triangle(this.offsetX, mountainY, triangleXright, mountainY, triangleXtop, mountainY-triangleHeights[this.typeID]);
        }
    }
}