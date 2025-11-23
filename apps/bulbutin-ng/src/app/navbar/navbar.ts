import { Component, inject } from '@angular/core';
import { ImageFeed } from '../services/image-feed';

@Component({
  selector: 'app-navbar',
  imports: [],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  private imageFeed = inject(ImageFeed);
  goToUpload() {
    window.location.href = this.imageFeed.uploadUrl;
  }
}
