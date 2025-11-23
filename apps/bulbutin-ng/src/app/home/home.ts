import { Component, ElementRef, viewChild, inject, OnDestroy } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { Toolbar } from '../toolbar/toolbar';
import { Navbar } from '../navbar/navbar';

@Component({
  selector: 'app-home',
  imports: [Toolbar, Navbar, RouterOutlet],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnDestroy {
  private router = inject(Router);
  private contentRef = viewChild<ElementRef<HTMLElement>>('content');
  private _routerSub?: Subscription;

  constructor() {
    this._routerSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => {
        const content = this.contentRef()?.nativeElement;
        if (content) {
          content.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        }
      });
  }

  ngOnDestroy(): void {
    this._routerSub?.unsubscribe();
  }
}
