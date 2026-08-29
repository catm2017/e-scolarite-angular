import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { NgScrollbar } from 'ngx-scrollbar';

interface HostelBlock {
  id: number;
  name: string;
  occupied: number;
  capacity: number;
  gender: 'Boys' | 'Girls';
}

interface MenuItem {
  id: number;
  meal: 'Breakfast' | 'Lunch' | 'Snacks' | 'Dinner';
  menu: string;
  rating: number; // 1 to 5 stars
  totalReviews: number;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-hostel-mess',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTabsModule, MatButtonModule, MatIconModule, MatProgressBarModule, NgScrollbar],
  templateUrl: './hostel-mess.component.html',
  styleUrls: ['./hostel-mess.component.scss']
})
export class HostelMessComponent {
  blocks: HostelBlock[] = [
    { id: 1, name: 'A-Block (Newton House)', occupied: 145, capacity: 150, gender: 'Boys' },
    { id: 2, name: 'B-Block (Einstein House)', occupied: 120, capacity: 150, gender: 'Boys' },
    { id: 3, name: 'C-Block (Curie House)', occupied: 138, capacity: 140, gender: 'Girls' },
    { id: 4, name: 'D-Block (Franklin House)', occupied: 95, capacity: 120, gender: 'Girls' }
  ];

  menuToday: MenuItem[] = [
    {
      id: 1,
      meal: 'Breakfast',
      menu: 'Pancakes, Fresh Berries, Eggs (Scrambled/Boiled), Milk & Coffee',
      rating: 4.5,
      totalReviews: 86
    },
    {
      id: 2,
      meal: 'Lunch',
      menu: 'Grilled Chicken Breasts / Herb Rice, Roasted Vegetables, Creamy Tomato Soup',
      rating: 4.8,
      totalReviews: 120
    },
    {
      id: 3,
      meal: 'Snacks',
      menu: 'Banana Nut Muffins, Herbal Tea, Fresh Fruits',
      rating: 4.2,
      totalReviews: 65
    },
    {
      id: 4,
      meal: 'Dinner',
      menu: 'Lasagna, Caesar Salad, Garlic Bread, Chocolate Pudding',
      rating: 4.7,
      totalReviews: 142
    }
  ];

  getOccupancyRate(occupied: number, capacity: number): number {
    return Math.round((occupied / capacity) * 100);
  }

  getStarArray(rating: number): number[] {
    const stars = [];
    const floor = Math.floor(rating);
    for (let i = 0; i < 5; i++) {
      if (i < floor) {
        stars.push(1); // full star
      } else if (i === floor && rating % 1 >= 0.5) {
        stars.push(0.5); // half star
      } else {
        stars.push(0); // empty star
      }
    }
    return stars;
  }
}
