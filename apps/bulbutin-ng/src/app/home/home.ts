import { Component } from '@angular/core';
import { Toolbar } from '../toolbar/toolbar';
import { Navbar } from '../navbar/navbar';

@Component({
  selector: 'app-home',
  imports: [Toolbar, Navbar],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {}
